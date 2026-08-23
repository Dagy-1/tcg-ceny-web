"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeftRight, Check, Minus, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthMenu from "../AuthMenu";
import MobileNav from "../MobileNav";
import {
  loadPortfolioProducts,
  type PortfolioProduct as Product,
  type PortfolioProductLoadStatus,
} from "../portfolio/central-products";
import { comparisonSummary } from "./comparison";

type Selection = { productId: string; quantity: number };
type Side = "mine" | "compared";

type CatalogComparisonProduct = {
  id: string;
  name: string;
  image_url: string | null;
  product_type: string | null;
  era: string | null;
  set_name: string | null;
  best_price_czk: number | null;
  checked_at: string | null;
};

const STORAGE_KEY = "tcg_product_comparison";
const CATALOG_TRANSFER_KEY = "tcg_comparison_catalog_product";

const formatCzk = (value: number) =>
  `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(value)} Kč`;

function descriptor(product: Product) {
  return [product.set, product.type].map((value) => value.trim()).filter(Boolean).join(" · ") || "Sealed produkt";
}

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("cs");
}

function priceAgeDays(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000)) : null;
}

function priceAgeLabel(value: string) {
  const age = priceAgeDays(value);
  if (age === null) return "Datum ceny není dostupné";
  if (age === 0) return "Cena aktualizována dnes";
  if (age === 1) return "Cena aktualizována včera";
  if (age < 5) return `Cena aktualizována před ${age} dny`;
  return `Cena aktualizována před ${age} dny`;
}

function fromCatalogProduct(product: CatalogComparisonProduct): Product {
  return {
    id: product.id,
    name: product.name,
    type: product.product_type || "Produkt",
    era: product.era || "",
    set: product.set_name || "",
    image: product.image_url || "",
    marketPrice: product.best_price_czk,
    priceUpdatedAt: product.checked_at || "",
  };
}

function ProductSearch({
  products,
  onAdd,
  side,
}: {
  products: Product[];
  onAdd: (productId: string) => void;
  side: Side;
}) {
  const [query, setQuery] = useState("");
  const needle = normalized(query.trim());
  const results = needle.length >= 2
    ? products.filter((product) => normalized(`${product.name} ${product.set} ${product.type}`).includes(needle)).slice(0, 7)
    : [];

  return (
    <div className="compare-search">
      <Search size={17} aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Najít produkt podle názvu nebo edice"
        aria-label={`Přidat produkt do ${side === "mine" ? "mého" : "srovnávaného"} výběru`}
        autoComplete="off"
      />
      {query && <button type="button" onClick={() => setQuery("")} aria-label="Vymazat hledání">×</button>}
      {results.length > 0 && (
        <div className="compare-search-results" role="listbox" aria-label="Nalezené produkty">
          {results.map((product) => (
            <button
              type="button"
              role="option"
              aria-selected="false"
              key={product.id}
              onClick={() => {
                onAdd(product.id);
                setQuery("");
              }}
            >
              <span className="compare-result-image">
                {product.image && <Image src={product.image} alt="" width={54} height={54} unoptimized />}
              </span>
              <span><strong>{product.name}</strong><small>{descriptor(product)}</small></span>
              <b>{product.marketPrice === null ? "Bez ceny" : formatCzk(product.marketPrice)}</b>
              <Plus size={16} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      {needle.length >= 2 && results.length === 0 && (
        <div className="compare-search-empty">Žádný odpovídající produkt jsme nenašli.</div>
      )}
    </div>
  );
}

function SelectionPanel({
  title,
  eyebrow,
  selection,
  products,
  onAdd,
  onQuantity,
  onRemove,
  side,
}: {
  title: string;
  eyebrow: string;
  selection: Selection[];
  products: Product[];
  onAdd: (id: string) => void;
  onQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  side: Side;
}) {
  const byId = new Map(products.map((product) => [product.id, product]));
  const rows = selection.flatMap((item) => {
    const product = byId.get(item.productId);
    return product ? [{ item, product }] : [];
  });
  const total = rows.reduce((sum, { item, product }) => sum + (product.marketPrice ?? 0) * item.quantity, 0);
  const missingPrices = rows.filter(({ product }) => product.marketPrice === null).length;

  return (
    <section className={`compare-side compare-side-${side}`} aria-labelledby={`compare-${side}-title`}>
      <div className="compare-side-heading">
        <div><p>{eyebrow}</p><h2 id={`compare-${side}-title`}>{title}</h2></div>
        <span>{selection.reduce((sum, item) => sum + item.quantity, 0)} ks</span>
      </div>
      <ProductSearch products={products} onAdd={onAdd} side={side} />
      <div className="compare-items">
        {rows.length ? rows.map(({ item, product }) => {
          const age = priceAgeDays(product.priceUpdatedAt);
          return (
            <article key={product.id} className={product.marketPrice === null ? "has-no-price" : undefined} data-motion>
              <div className="compare-product-image">
                {product.image && <Image src={product.image} alt="" width={76} height={76} unoptimized />}
              </div>
              <div className="compare-product-copy">
                <small>{descriptor(product)}</small>
                <h3>{product.name}</h3>
                <span className={age !== null && age > 7 ? "is-stale" : undefined}>
                  {product.marketPrice === null ? "Aktuální cena chybí" : priceAgeLabel(product.priceUpdatedAt)}
                </span>
              </div>
              <div className="compare-product-price">
                <strong>{product.marketPrice === null ? "—" : formatCzk(product.marketPrice * item.quantity)}</strong>
                {item.quantity > 1 && product.marketPrice !== null && <small>{item.quantity} × {formatCzk(product.marketPrice)}</small>}
              </div>
              <div className="compare-quantity" aria-label={`Množství ${product.name}`}>
                <button type="button" onClick={() => onQuantity(product.id, -1)} aria-label={`Snížit množství ${product.name}`}><Minus size={14} /></button>
                <b>{item.quantity}</b>
                <button type="button" onClick={() => onQuantity(product.id, 1)} aria-label={`Zvýšit množství ${product.name}`}><Plus size={14} /></button>
              </div>
              <button className="compare-remove" type="button" onClick={() => onRemove(product.id)} aria-label={`Odebrat ${product.name}`}><Trash2 size={16} /></button>
            </article>
          );
        }) : (
          <div className="compare-empty">
            <span><Plus size={20} aria-hidden="true" /></span>
            <strong>Začni přidáním produktu</strong>
            <p>Vyhledej jeden nebo více produktů a nastav jejich množství.</p>
          </div>
        )}
      </div>
      <footer className="compare-side-total">
        <span>Aktuální hodnota výběru</span>
        <strong>{formatCzk(total)}</strong>
        {missingPrices > 0 && <small>{missingPrices} {missingPrices === 1 ? "položka není" : "položky nejsou"} započítána</small>}
      </footer>
    </section>
  );
}

export default function CompareClient({
  initialProducts,
  productCount,
  sourceUpdatedAt,
}: {
  initialProducts: Product[];
  productCount: number;
  sourceUpdatedAt: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [mine, setMine] = useState<Selection[]>([]);
  const [compared, setCompared] = useState<Selection[]>([]);
  const [ready, setReady] = useState(false);
  const [productLoadStatus, setProductLoadStatus] = useState<PortfolioProductLoadStatus | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const hydrate = async () => {
      const query = new URLSearchParams(window.location.search);
      const requestedProduct = query.get("add");
      const transferredPrice = Number(query.get("addPrice"));
      const transferredFromUrl: CatalogComparisonProduct | null = requestedProduct && query.get("addName") ? {
        id: requestedProduct,
        name: query.get("addName") || "",
        image_url: query.get("addImage") || null,
        product_type: query.get("addType") || null,
        era: query.get("addEra") || null,
        set_name: query.get("addSet") || null,
        best_price_czk: Number.isFinite(transferredPrice) && query.get("addPrice") !== "" ? transferredPrice : null,
        checked_at: query.get("addChecked") || null,
      } : null;

      if (transferredFromUrl?.name) {
        const immediateProduct = fromCatalogProduct(transferredFromUrl);
        setProducts((current) => current.some((product) => product.id === immediateProduct.id)
          ? current
          : [...current, immediateProduct]);
        try {
          const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "null") as { mine?: Selection[]; compared?: Selection[] } | null;
          const savedMine = Array.isArray(saved?.mine) ? saved.mine : [];
          setMine(savedMine.some((item) => item.productId === transferredFromUrl.id)
            ? savedMine
            : [...savedMine, { productId: transferredFromUrl.id, quantity: 1 }]);
          if (Array.isArray(saved?.compared)) setCompared(saved.compared);
        } catch {
          setMine([{ productId: transferredFromUrl.id, quantity: 1 }]);
        }
        const cleanUrl = new URL(window.location.href);
        ["add", "addName", "addImage", "addType", "addEra", "addSet", "addPrice", "addChecked"]
          .forEach((parameter) => cleanUrl.searchParams.delete(parameter));
        window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
        setReady(true);
      }

      let loadedProducts = await loadPortfolioProducts(
        initialProducts,
        controller.signal,
        setProductLoadStatus,
      );

      if (requestedProduct && !loadedProducts.some((product) => product.id === requestedProduct)) {
        if (transferredFromUrl?.name) {
          loadedProducts = [...loadedProducts, fromCatalogProduct(transferredFromUrl)];
        }
      }

      if (requestedProduct && !loadedProducts.some((product) => product.id === requestedProduct)) {
        try {
          const transferred = JSON.parse(
            window.sessionStorage.getItem(CATALOG_TRANSFER_KEY) || "null",
          ) as CatalogComparisonProduct | null;
          window.sessionStorage.removeItem(CATALOG_TRANSFER_KEY);
          if (transferred?.id === requestedProduct && transferred.name) {
            loadedProducts = [...loadedProducts, fromCatalogProduct(transferred)];
          }
        } catch { /* Fall through to the catalog API. */ }
      }

      if (requestedProduct && !loadedProducts.some((product) => product.id === requestedProduct)) {
        try {
          const response = await fetch(`/api/catalog/products/${encodeURIComponent(requestedProduct)}`, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("Requested catalog product is unavailable");
          const catalogProduct = await response.json() as CatalogComparisonProduct;
          if (catalogProduct.id !== requestedProduct || !catalogProduct.name) {
            throw new Error("Requested catalog product is invalid");
          }
          loadedProducts = [...loadedProducts, fromCatalogProduct(catalogProduct)];
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }

      if (!active) return;
      if (loadedProducts.length) setProducts(loadedProducts);
      if (!transferredFromUrl) {
        try {
          const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "null") as { mine?: Selection[]; compared?: Selection[] } | null;
          if (Array.isArray(saved?.mine)) setMine(saved.mine);
          if (Array.isArray(saved?.compared)) setCompared(saved.compared);
        } catch { /* Ignore invalid or unavailable session storage. */ }
        if (requestedProduct && loadedProducts.some((product) => product.id === requestedProduct)) {
          setMine((current) => current.some((item) => item.productId === requestedProduct)
            ? current
            : [...current, { productId: requestedProduct, quantity: 1 }]);
        }
      }
      const cleanUrl = new URL(window.location.href);
      ["add", "addName", "addImage", "addType", "addEra", "addSet", "addPrice", "addChecked"]
        .forEach((parameter) => cleanUrl.searchParams.delete(parameter));
      window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
      setReady(true);
    };
    void hydrate().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (active) setReady(true);
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [initialProducts]);

  useEffect(() => {
    if (!ready) return;
    try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ mine, compared })); } catch { /* Optional convenience only. */ }
  }, [mine, compared, ready]);

  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const displayedSourceUpdatedAt = products.reduce(
    (latest, product) => product.priceUpdatedAt > latest ? product.priceUpdatedAt : latest,
    "",
  ) || sourceUpdatedAt;
  const summary = comparisonSummary(
    mine.map((item) => ({ price: byId.get(item.productId)?.marketPrice ?? null, quantity: item.quantity })),
    compared.map((item) => ({ price: byId.get(item.productId)?.marketPrice ?? null, quantity: item.quantity })),
  );
  const { mineTotal, comparedTotal, difference, differencePercent, balanced } = summary;
  const hasBoth = mine.length > 0 && compared.length > 0;
  const verdict = !hasBoth
    ? "Přidej produkty do obou výběrů"
    : balanced
      ? "Výběry jsou hodnotově vyrovnané"
      : difference > 0
        ? "Můj výběr má vyšší hodnotu"
        : "Srovnávaný výběr má vyšší hodnotu";
  const verdictTone = !hasBoth ? "neutral" : balanced ? "balanced" : differencePercent <= 8 ? "mild" : "strong";

  const setFor = (side: Side, update: (current: Selection[]) => Selection[]) =>
    side === "mine" ? setMine(update) : setCompared(update);
  const add = (side: Side, productId: string) => setFor(side, (current) => {
    const existing = current.find((item) => item.productId === productId);
    return existing
      ? current.map((item) => item.productId === productId ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item)
      : [...current, { productId, quantity: 1 }];
  });
  const quantity = (side: Side, productId: string, delta: number) => setFor(side, (current) =>
    current.map((item) => item.productId === productId ? { ...item, quantity: Math.max(1, Math.min(99, item.quantity + delta)) } : item));
  const remove = (side: Side, productId: string) => setFor(side, (current) => current.filter((item) => item.productId !== productId));
  const clear = () => { setMine([]); setCompared([]); };

  return (
    <main className="compare-page">
      <nav className="nav compare-nav" aria-label="Hlavní navigace">
        <Link className="brand" href="/" aria-label="TCG Ceny – úvod"><span className="brand-mark" aria-hidden="true"><span /><span /></span><span>TCG <strong>Ceny</strong></span></Link>
        <div className="nav-links"><Link href="/katalog/">Katalog</Link><Link href="/zlevneni/">Zlevnění</Link><Link className="compare-nav-active" href="/porovnani/" aria-current="page">Porovnání</Link><Link href="/portfolio/">Portfolio</Link><Link href="/sledovani/">Sledování</Link><Link href="/pro-eshopy/">Pro e-shopy</Link></div>
        <div className="nav-actions"><AuthMenu /><MobileNav /></div>
      </nav>

      <header className="compare-hero shell" data-motion>
        <div>
          <p className="eyebrow"><span className="live-dot" /> Porovnání produktů</p>
          <h1>Srovnej hodnotu.<span>Rozhodni se s přehledem.</span></h1>
          <p>Postav proti sobě libovolné kombinace sealed produktů. Používáme pouze jejich aktuální tržní hodnotu – bez nákupních cen a zbytečných údajů.</p>
        </div>
        <aside>
          <strong>{new Intl.NumberFormat("cs-CZ").format(Math.max(productCount, products.length))}</strong>
          <span>produktů k porovnání</span>
          <small>Tržní data obnovena {displayedSourceUpdatedAt.slice(0, 10).split("-").reverse().join(". ")}</small>
        </aside>
      </header>

      {productLoadStatus?.source === "fallback" && (
        <p className="compare-data-warning shell" role="status">
          Centrální ceny jsou dočasně nedostupné. Zobrazuje se poslední bezpečný snapshot
          {productLoadStatus.sourceUpdatedAt
            ? ` z ${productLoadStatus.sourceUpdatedAt.slice(0, 10).split("-").reverse().join(". ")}`
            : ""}. Před rozhodnutím cenu ověř.
        </p>
      )}

      <section className="compare-workspace shell" aria-label="Porovnání aktuální hodnoty produktů">
        <div className="compare-toolbar">
          <p><Check size={15} aria-hidden="true" /> Výběr se průběžně ukládá v tomto prohlížeči</p>
          <div>
            <button type="button" onClick={() => { setMine(compared); setCompared(mine); }} disabled={!mine.length && !compared.length}><ArrowLeftRight size={16} /> Prohodit výběry</button>
            <button type="button" onClick={clear} disabled={!mine.length && !compared.length}><RotateCcw size={15} /> Začít znovu</button>
          </div>
        </div>

        <div className="compare-columns" data-motion>
          <SelectionPanel title="Můj výběr" eyebrow="Co nabízím nebo zvažuji" side="mine" selection={mine} products={products} onAdd={(id) => add("mine", id)} onQuantity={(id, delta) => quantity("mine", id, delta)} onRemove={(id) => remove("mine", id)} />
          <div className={`compare-versus${hasBoth ? " is-ready" : ""}`} aria-hidden="true"><span>VS</span></div>
          <SelectionPanel title="Srovnávaný výběr" eyebrow="S čím hodnotu porovnávám" side="compared" selection={compared} products={products} onAdd={(id) => add("compared", id)} onQuantity={(id, delta) => quantity("compared", id, delta)} onRemove={(id) => remove("compared", id)} />
        </div>

        <section className={`compare-result is-${verdictTone}`} aria-live="polite" data-motion>
          <div className="compare-result-label"><span>Výsledek porovnání</span><h2>{verdict}</h2><p>{hasBoth ? `Rozdíl představuje ${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(differencePercent)} % hodnotnějšího výběru.` : "Jakmile přidáš produkty na obě strany, spočítáme rozdíl i doporučené dorovnání."}</p></div>
          <div className="compare-result-values">
            <article><span>Můj výběr</span><strong>{formatCzk(mineTotal)}</strong></article>
            <article><span>Srovnávaný výběr</span><strong>{formatCzk(comparedTotal)}</strong></article>
            <article className="compare-settlement"><span>{hasBoth ? "Doporučené dorovnání" : "Rozdíl hodnoty"}</span><strong>{hasBoth ? formatCzk(Math.abs(difference)) : "—"}</strong><small>{!hasBoth ? "Čeká na oba výběry" : balanced ? "Bez nutnosti významného dorovnání" : difference > 0 ? "ke srovnávanému výběru" : "k mému výběru"}</small></article>
          </div>
        </section>
      </section>

      <footer className="compare-footer shell"><span>Aktuální hodnoty jsou orientační a mohou se měnit podle vývoje trhu.</span><Link href="/katalog/">Prohlédnout katalog →</Link></footer>
    </main>
  );
}
