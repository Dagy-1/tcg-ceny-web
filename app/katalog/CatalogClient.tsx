"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PackageCheck, PackageX } from "lucide-react";
import AuthMenu from "../AuthMenu";
import MobileNav from "../MobileNav";
import ProductAlertControl from "./ProductAlertControl";
import {
  productFromApi,
  productPath,
  type ApiProduct,
  type Availability,
  type CatalogData,
  type Product,
} from "./catalog-model";

export type { CatalogData } from "./catalog-model";

const PAGE_SIZE = 24;

type ApiCatalogPage = {
  items: ApiProduct[];
  total: number;
  limit: number;
  offset: number;
};

type SortMode = "recommended" | "price-asc" | "price-desc" | "name" | "newest";
type ConditionMode = Product["condition"];

function formatPrice(price: number | null) {
  if (price === null) return "Cena není dostupná";
  return `${new Intl.NumberFormat("cs-CZ").format(price)} Kč`;
}

function formatReleaseDate(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("cs");
}

function statusLabel(status: Availability) {
  if (status === "online") return "Skladem online";
  if (status === "store") return "Pouze na prodejně";
  return "Momentálně vyprodáno";
}

function resultCountLabel(count: number) {
  if (count === 1) return "nalezený produkt";
  if (count >= 2 && count <= 4) return "nalezené produkty";
  return "nalezených produktů";
}

function offerCountLabel(count: number, storeOnly = false) {
  const place = storeOnly ? "na prodejně" : "online";
  if (count === 1) return `1 nabídka ${place}`;
  if (count >= 2 && count <= 4) return `${count} nabídky ${place}`;
  return `${count} nabídek ${place}`;
}

function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);

  if (!product.image || failed) {
    return (
      <div className="catalog-image-fallback" aria-label="Obrázek není dostupný">
        <span>TCG</span>
        <small>{product.type}</small>
      </div>
    );
  }

  return (
    // Product images come from the verified shop URLs stored in the catalog.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={product.image}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function CatalogClient({ data }: { data: CatalogData }) {
  const [catalogData, setCatalogData] = useState(data);
  const [query, setQuery] = useState("");
  const [era, setEra] = useState("all");
  const [setName, setSetName] = useState("all");
  const [type, setType] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [condition, setCondition] = useState<ConditionMode>("sealed");
  const [sort, setSort] = useState<SortMode>("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const loadCatalog = async () => {
      try {
        const items: ApiProduct[] = [];
        let total = 1;
        for (let offset = 0; offset < total; offset += 100) {
          const response = await fetch(`/api/catalog/products?limit=100&offset=${offset}&sort=newest`, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("Central catalog is unavailable");
          const page = (await response.json()) as ApiCatalogPage;
          if (!Array.isArray(page.items) || !Number.isInteger(page.total) || page.total < 0) {
            throw new Error("Central catalog returned an invalid response");
          }
          total = page.total;
          items.push(...page.items);
        }
        if (items.length !== total) throw new Error("Central catalog response is incomplete");
        const fallbackById = new Map(data.products.map((product) => [product.id, product]));
        if (active) {
          setCatalogData({
            generatedAt: Date.now(),
            productCount: total,
            products: items.map((product) => productFromApi(product, fallbackById.get(product.id))),
          });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // The embedded build snapshot is the deliberate availability fallback.
      }
    };
    void loadCatalog();
    return () => {
      active = false;
      controller.abort();
    };
  }, [data]);

  const eras = useMemo(
    () => [...new Set(catalogData.products.map((product) => product.era))].sort((a, b) => a.localeCompare(b, "cs")),
    [catalogData.products],
  );
  const sets = useMemo(
    () =>
      [...new Set(catalogData.products.filter((product) => era === "all" || product.era === era).map((product) => product.set))]
        .sort((a, b) => a.localeCompare(b, "cs")),
    [catalogData.products, era],
  );
  const types = useMemo(
    () => [...new Set(catalogData.products.map((product) => product.type))].sort((a, b) => a.localeCompare(b, "cs")),
    [catalogData.products],
  );

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    const products = catalogData.products.filter((product) => {
      const searchable = normalize(`${product.name} ${product.era} ${product.set} ${product.type}`);
      return (
        (!needle || searchable.includes(needle)) &&
        (era === "all" || product.era === era) &&
        (setName === "all" || product.set === setName) &&
        (type === "all" || product.type === type) &&
        product.condition === condition &&
        (availability === "all" || product.availability === availability)
      );
    });

    return products.sort((left, right) => {
      if (sort === "name") return left.name.localeCompare(right.name, "cs");
      if (sort === "newest") {
        return String(right.releaseDate || "").localeCompare(String(left.releaseDate || "")) ||
          left.name.localeCompare(right.name, "cs");
      }
      if (sort === "price-asc" || sort === "price-desc") {
        if (left.bestPrice === null) return 1;
        if (right.bestPrice === null) return -1;
        return sort === "price-asc"
          ? left.bestPrice - right.bestPrice
          : right.bestPrice - left.bestPrice;
      }
      const availabilityPriority = { online: 0, store: 1, unavailable: 2 };
      return (
        availabilityPriority[left.availability] - availabilityPriority[right.availability] ||
        (left.bestPrice ?? Number.MAX_SAFE_INTEGER) - (right.bestPrice ?? Number.MAX_SAFE_INTEGER)
      );
    });
  }, [availability, condition, catalogData.products, era, query, setName, sort, type]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const onlineCount = catalogData.products.filter((product) => product.availability === "online").length;
  const sealedCount = catalogData.products.filter((product) => product.condition === "sealed").length;
  const openingCount = catalogData.products.filter((product) => product.condition === "opening").length;
  const activeFilters = [era, setName, type, availability].filter((value) => value !== "all").length +
    Number(Boolean(query));

  const clearFilters = () => {
    setQuery("");
    setEra("all");
    setSetName("all");
    setType("all");
    setAvailability("all");
    setPage(1);
  };

  return (
    <main className="catalog-page">
      <nav className="nav catalog-nav" aria-label="Hlavní navigace">
        <Link className="brand" href="/" aria-label="TCG Ceny – úvod">
          <span className="brand-mark" aria-hidden="true"><span /><span /></span>
          <span>TCG <strong>Ceny</strong></span>
        </Link>
        <div className="nav-links">
          <Link className="catalog-nav-active" href="/katalog" aria-current="page">Katalog</Link>
          <Link href="/zlevneni/">Zlevnění</Link>
          <Link href="/porovnani/">Porovnání</Link>
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/sledovani/">Sledování</Link>
          <Link href="/pro-eshopy">Pro e-shopy</Link>
        </div>
        <div className="nav-actions">
          <AuthMenu />
          <MobileNav />
        </div>
      </nav>

      <header className="catalog-header shell" data-motion>
        <div>
          <p className="eyebrow"><span className="live-dot" /> Katalog TCG Ceny</p>
          <h1>Najdi produkt.<span>Porovnej český trh.</span></h1>
          <p>
            Aktuální ceny a skladovost zapečetěných Pokémon TCG produktů na jednom místě.
            Bez placeného pořadí a bez zbytečného hledání.
          </p>
        </div>
        <div className="catalog-summary" aria-label="Souhrn katalogu">
          <div><strong>{catalogData.productCount}</strong><span>produktů v katalogu</span></div>
          <div><strong>{onlineCount}</strong><span>právě skladem online</span></div>
          <div><strong>{eras.length}</strong><span>hlavní produktové série</span></div>
        </div>
      </header>

      <section className="catalog-condition shell" aria-labelledby="catalog-condition-title" data-motion>
        <div className="catalog-condition-heading">
          <p className="catalog-condition-kicker">Nejdřív vyber stav</p>
          <h2 id="catalog-condition-title">Co hledáš do své sbírky?</h2>
          <p>Oddělujeme nepoškozené kusy od produktů s vadou obalu, aby bylo porovnání cen fér.</p>
        </div>
        <div className="catalog-condition-switch" role="group" aria-label="Stav produktu">
          <button
            type="button"
            className={`catalog-condition-option catalog-condition-option-sealed${condition === "sealed" ? " is-active" : ""}`}
            aria-pressed={condition === "sealed"}
            aria-label={`Sběratelský stav, ${sealedCount} produktů`}
            onClick={() => {
              setCondition("sealed");
              setPage(1);
            }}
          >
            <span className="catalog-condition-icon" aria-hidden="true">
              <PackageCheck />
            </span>
            <span className="catalog-condition-copy">
              <strong>Sběratelský stav</strong>
              <small>
                <span>Nepoškozený obal</span>
                <span>Vhodný do sbírky</span>
              </small>
            </span>
            <b className="catalog-condition-count">
              {sealedCount}
              <small>produktů</small>
            </b>
          </button>
          <button
            type="button"
            className={`catalog-condition-option catalog-condition-option-opening${condition === "opening" ? " is-active" : ""}`}
            aria-pressed={condition === "opening"}
            aria-label={`Vada obalu, ${openingCount} produktů`}
            onClick={() => {
              setCondition("opening");
              setPage(1);
            }}
          >
            <span className="catalog-condition-icon" aria-hidden="true">
              <PackageX />
            </span>
            <span className="catalog-condition-copy">
              <strong>Vada obalu</strong>
              <small>
                <span>Levnější kusy</span>
                <span>S kosmetickou vadou</span>
              </small>
            </span>
            <b className="catalog-condition-count">
              {openingCount}
              <small>produktů</small>
            </b>
          </button>
        </div>
      </section>

      <section className="catalog-workspace shell">
        <div className="catalog-toolbar" data-motion>
          <label className="catalog-search">
            <span>Hledat produkt</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Např. Chaos Rising, ETB nebo Greninja…"
            />
          </label>
          <label>
            <span>Série</span>
            <select
              value={era}
              onChange={(event) => {
                setEra(event.target.value);
                setSetName("all");
                setPage(1);
              }}
            >
              <option value="all">Všechny série</option>
              {eras.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Edice</span>
            <select
              value={setName}
              onChange={(event) => {
                setSetName(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">Všechny edice</option>
              {sets.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Typ</span>
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">Všechny typy</option>
              {types.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Dostupnost</span>
            <select
              value={availability}
              onChange={(event) => {
                setAvailability(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">Všechny stavy</option>
              <option value="online">Skladem online</option>
              <option value="store">Pouze na prodejně</option>
              <option value="unavailable">Vyprodáno</option>
            </select>
          </label>
        </div>

        <div className="catalog-result-bar">
          <p className="catalog-result-count" key={`${filtered.length}-${condition}`}><strong>{filtered.length}</strong> {resultCountLabel(filtered.length)}</p>
          <div>
            {activeFilters > 0 && (
              <button type="button" className="catalog-clear" onClick={clearFilters}>
                Zrušit filtry ({activeFilters})
              </button>
            )}
            <label className="catalog-sort">
              <span>Řazení</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortMode);
                  setPage(1);
                }}
              >
                <option value="newest">Nejnovější vydání</option>
                <option value="recommended">Doporučené</option>
                <option value="price-asc">Nejnižší cena</option>
                <option value="price-desc">Nejvyšší cena</option>
                <option value="name">Název A–Z</option>
              </select>
            </label>
          </div>
        </div>

        {visibleProducts.length ? (
          <div className="catalog-grid">
            {visibleProducts.map((product) => (
              <article
                className={`catalog-card catalog-card-${product.availability}`}
                key={product.id}
              >
                <Link className="catalog-card-link" href={productPath(product)} aria-label={`Detail produktu ${product.name}`}>
                  <div className="catalog-card-image">
                    <ProductImage product={product} />
                  </div>
                  <div className="catalog-card-body">
                    <div className="catalog-card-meta">
                      <span>{product.set}</span>
                      <b>{product.type}</b>
                    </div>
                    <h2>{product.name}</h2>
                    <p>
                      {product.era}
                      {formatReleaseDate(product.releaseDate) && (
                        <> · Vydání <time dateTime={product.releaseDate || undefined}>{formatReleaseDate(product.releaseDate)}</time></>
                      )}
                    </p>
                    <div className="catalog-card-bottom">
                      <div>
                        <span className={`catalog-status catalog-status-${product.availability}`}>
                          <i aria-hidden="true" />{statusLabel(product.availability)}
                        </span>
                        <small>
                          {product.availableOffers
                            ? offerCountLabel(product.availableOffers)
                            : product.storeOffers
                              ? offerCountLabel(product.storeOffers, true)
                              : "Čeká na naskladnění"}
                        </small>
                      </div>
                      <strong>{formatPrice(product.bestPrice)}</strong>
                    </div>
                  </div>
                </Link>
                <ProductAlertControl product={product} variant="icon" />
              </article>
            ))}
          </div>
        ) : (
          <div className="catalog-no-results">
            <span>0 výsledků</span>
            <h2>Této kombinaci nic neodpovídá.</h2>
            <p>Zkus upravit hledaný výraz nebo zrušit některý z filtrů.</p>
            <button type="button" onClick={clearFilters}>Zobrazit celý katalog</button>
          </div>
        )}

        {pageCount > 1 && (
          <nav className="catalog-pagination" aria-label="Stránkování katalogu">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
              ← Předchozí
            </button>
            <span>Strana <strong>{page}</strong> z {pageCount}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}>
              Další →
            </button>
          </nav>
        )}
      </section>

      <footer className="footer catalog-footer">
        <div className="shell legal">
          <span>© 2026 TCG Ceny · veřejná beta</span>
          <span>Ceny a dostupnost se mohou v e-shopu změnit. Před nákupem je vždy ověř.</span>
        </div>
      </footer>

    </main>
  );
}
