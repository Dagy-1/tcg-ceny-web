"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AuthMenu from "../AuthMenu";
import MobileNav from "../MobileNav";
import catalogData from "../katalog/catalog-data.json";
import { productPath, type CatalogData } from "../katalog/catalog-model";

type Period = 1 | 7 | 30;
type Sort = "newest" | "largest";
type PageState = "loading" | "ready" | "error";

type PriceDrop = {
  id: string;
  product_id: string;
  product_name: string;
  image_url: string | null;
  shop: string;
  url: string;
  old_price_czk: number;
  new_price_czk: number;
  saved_czk: number;
  drop_percent: number;
  occurred_at: string;
};

type PriceDropResponse = { items: PriceDrop[]; total: number; limit: number; offset: number };

const periodOptions: Array<{ value: Period; label: string }> = [
  { value: 1, label: "24 hodin" },
  { value: 7, label: "7 dní" },
  { value: 30, label: "30 dní" },
];

const embeddedImages = new Map(
  (catalogData as CatalogData).products.map((product) => [product.id, product.image]),
);

function formatPrice(value: number) {
  return `${new Intl.NumberFormat("cs-CZ").format(value)} Kč`;
}

function formatMoment(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Právě potvrzeno";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return "Právě teď";
  if (minutes < 60) return `Před ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Před ${hours} h`;
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function safeOfferUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function ProductImage({ item }: { item: PriceDrop }) {
  const [failed, setFailed] = useState(false);
  const embedded = embeddedImages.get(item.product_id)?.trim() || "";
  let remote = "";
  try {
    const candidate = new URL(item.image_url || "");
    if (candidate.protocol === "https:" && candidate.hostname === "pokemonproductimages.pokedata.io") remote = candidate.toString();
  } catch {
    remote = "";
  }
  const source = embedded || remote;
  if (!source || failed) return <span aria-label="Obrázek produktu není dostupný">TCG</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={source} alt="" loading="lazy" onError={() => setFailed(true)} />
  );
}

export default function PriceDropsClient() {
  const [period, setPeriod] = useState<Period>(7);
  const [sort, setSort] = useState<Sort>("newest");
  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<PriceDropResponse>({ items: [], total: 0, limit: 100, offset: 0 });

  const load = useCallback(async (selectedPeriod: Period) => {
    setState("loading");
    try {
      const response = await fetch(`/api/catalog/price-drops?days=${selectedPeriod}&limit=100`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Price drops unavailable");
      setData(await response.json() as PriceDropResponse);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load(period));
  }, [load, period]);

  const items = useMemo(() => {
    const next = [...data.items];
    if (sort === "largest") next.sort((a, b) => b.drop_percent - a.drop_percent || b.saved_czk - a.saved_czk);
    return next;
  }, [data.items, sort]);
  const largest = useMemo(() => data.items.reduce<PriceDrop | null>((best, item) => !best || item.drop_percent > best.drop_percent ? item : best, null), [data.items]);

  return (
    <>
      <nav className="nav" aria-label="Hlavní navigace">
        <Link className="brand" href="/" aria-label="TCG Ceny — domů">
          <span className="brand-mark"><span /><span /></span><span>TCG <strong>Ceny</strong></span>
        </Link>
        <div className="nav-links">
          <Link href="/katalog/">Katalog</Link><Link href="/zlevneni/" aria-current="page">Zlevnění</Link><Link href="/porovnani/">Porovnání</Link><Link href="/portfolio/">Portfolio</Link><Link href="/sledovani/">Sledování</Link><Link className="nav-partner" href="/pro-eshopy/">Pro e-shopy</Link>
        </div>
        <div className="nav-actions"><MobileNav /><AuthMenu /></div>
      </nav>

      <main className="drops-main shell">
        <header className="drops-hero">
          <div>
            <p className="drops-eyebrow"><span /> Potvrzené pohyby trhu</p>
            <h1>Zlevnění, která<br /><strong>stojí za pozornost.</strong></h1>
            <p>Jakmile ověřená nejnižší cena produktu klesne, objeví se tady. Přehled používá stejné potvrzené události jako náš Discord.</p>
          </div>
          <div className="drops-trust">
            <ShieldCheck aria-hidden="true" />
            <div><span>Bez falešných poplachů</span><small>Výrazné změny potvrzujeme dvěma kontrolami.</small></div>
          </div>
        </header>

        <section className="drops-toolbar" aria-label="Nastavení přehledu">
          <div className="drops-period" aria-label="Období">
            {periodOptions.map((option) => <button type="button" className={period === option.value ? "is-active" : undefined} aria-pressed={period === option.value} onClick={() => setPeriod(option.value)} key={option.value}>{option.label}</button>)}
          </div>
          <div className="drops-sort">
            <button type="button" className={sort === "newest" ? "is-active" : undefined} onClick={() => setSort("newest")}>Nejnovější</button>
            <button type="button" className={sort === "largest" ? "is-active" : undefined} onClick={() => setSort("largest")}>Největší pokles</button>
          </div>
        </section>

        {state === "ready" && data.items.length > 0 && (
          <section className="drops-summary" aria-label="Souhrn zlevnění">
            <div><span>Potvrzených zlevnění</span><strong>{data.total}</strong><small>za zvolené období</small></div>
            <div><span>Největší pokles</span><strong>−{largest?.drop_percent.toLocaleString("cs-CZ")} %</strong><small>{largest ? formatPrice(largest.saved_czk) : "—"} dolů</small></div>
            <div><span>Poslední potvrzení</span><strong>{formatMoment(data.items[0].occurred_at)}</strong><small>automaticky aktualizováno</small></div>
          </section>
        )}

        {state === "loading" && <section className="drops-state" aria-live="polite"><span className="drops-loader" /><h2>Načítám potvrzená zlevnění</h2><p>Kontroluji poslední bezpečně doručené události.</p></section>}
        {state === "error" && <section className="drops-state"><RefreshCw aria-hidden="true" /><h2>Přehled se teď nepodařilo načíst</h2><p>Katalog dál funguje. Zkus přehled za chvíli obnovit.</p><button type="button" onClick={() => void load(period)}>Zkusit znovu</button></section>}
        {state === "ready" && data.items.length === 0 && <section className="drops-state drops-empty"><Sparkles aria-hidden="true" /><h2>V tomto období zatím žádné potvrzené zlevnění</h2><p>To je v pořádku — zobrazujeme jen skutečné poklesy nejnižší dostupné ceny.</p><Link href="/katalog/">Prohlédnout katalog</Link></section>}

        {state === "ready" && items.length > 0 && (
          <section className="drops-feed" aria-label="Seznam potvrzených zlevnění">
            <div className="drops-section-head"><div><p>Aktuální přehled</p><h2>Nejnovější pohyby cen</h2></div><span>{data.total} {data.total === 1 ? "zlevnění" : "zlevnění"}</span></div>
            <div className="drops-list">
              {items.map((item) => {
                const offerUrl = safeOfferUrl(item.url);
                const detailPath = productPath({ id: item.product_id, name: item.product_name });
                return (
                  <article className="drop-card" key={item.id}>
                    <Link className="drop-image" href={detailPath} aria-label={`Otevřít ${item.product_name}`}><ProductImage item={item} /></Link>
                    <div className="drop-content">
                      <div className="drop-heading"><div><span className="drop-confirmed"><i /> Potvrzené zlevnění</span><h3><Link href={detailPath}>{item.product_name}</Link></h3></div><time dateTime={item.occurred_at}>{formatMoment(item.occurred_at)}</time></div>
                      <div className="drop-price-line">
                        <div className="drop-prices"><span>{formatPrice(item.old_price_czk)}</span><ArrowDownRight aria-hidden="true" /><strong>{formatPrice(item.new_price_czk)}</strong></div>
                        <div className="drop-saving"><strong>−{formatPrice(item.saved_czk)}</strong><span>−{item.drop_percent.toLocaleString("cs-CZ")} %</span></div>
                      </div>
                      <div className="drop-footer"><span>Nejlevněji nyní u <strong>{item.shop}</strong></span><div><Link href={detailPath}>Detail produktu</Link>{offerUrl && <a href={offerUrl} target="_blank" rel="noopener noreferrer">Otevřít nabídku <ArrowUpRight size={15} aria-hidden="true" /></a>}</div></div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
