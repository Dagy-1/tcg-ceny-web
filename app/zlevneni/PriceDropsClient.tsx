"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, PackageCheck, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import HeaderActions from "../HeaderActions";
import BrandedLoader from "../BrandedLoader";
import NavStatusLink, { lastSeenPriceDrop, rememberLatestPriceDrop } from "../NavStatusLink";
import catalogData from "../katalog/catalog-data.json";
import { productPath, type CatalogData } from "../katalog/catalog-model";
import { safeShopUrl } from "../shop-url";

type Period = 1 | 7 | 30;
type Sort = "newest" | "largest";
type ChangeKind = "all" | "price_drop" | "restock";
type PageState = "loading" | "ready" | "error";

type PriceDrop = {
  id: string;
  event_type: "price_drop" | "restock";
  product_id: string;
  product_name: string;
  image_url: string | null;
  shop: string;
  url: string;
  old_price_czk: number | null;
  new_price_czk: number | null;
  saved_czk: number | null;
  drop_percent: number | null;
  occurred_at: string;
};

type PriceDropResponse = { items: PriceDrop[]; total: number; limit: number; offset: number };

const periodOptions: Array<{ value: Period; label: string }> = [
  { value: 1, label: "24 hodin" },
  { value: 7, label: "7 dní" },
  { value: 30, label: "30 dní" },
];
const kindOptions: Array<{ value: ChangeKind; label: string }> = [
  { value: "all", label: "Vše" },
  { value: "price_drop", label: "Zlevnění" },
  { value: "restock", label: "Nově skladem" },
];
const PAGE_SIZE = 24;

const embeddedImages = new Map(
  (catalogData as CatalogData).products.map((product) => [product.id, product.image]),
);
const embeddedPaths = new Map(
  (catalogData as CatalogData).products.map((product) => [product.id, productPath(product)]),
);

function formatPrice(value: number | null) {
  if (value === null) return "Cena neuvedena";
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
  const [kind, setKind] = useState<ChangeKind>("all");
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<PriceDropResponse>({ items: [], total: 0, limit: PAGE_SIZE, offset: 0 });
  const [previousSeenAt, setPreviousSeenAt] = useState<string | null>(null);
  const seenInitialized = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      if (!seenInitialized.current) {
        setPreviousSeenAt(lastSeenPriceDrop());
        seenInitialized.current = true;
      }
      setState("loading");
      void (async () => {
        try {
          const response = await fetch(`/api/catalog/changes?days=${period}&event_type=${kind}&sort=${sort}&limit=${PAGE_SIZE}&offset=${offset}`, {
            headers: { Accept: "application/json" }, signal: controller.signal,
          });
          if (!response.ok) throw new Error("Changes unavailable");
          const next = await response.json() as PriceDropResponse;
          if (controller.signal.aborted) return;
          setData(next);
          setState("ready");
          // A filtered or older page must not mark unseen events of the other kind as read.
          if (kind === "all" && sort === "newest" && offset === 0) rememberLatestPriceDrop(next.items[0]?.occurred_at);
        } catch {
          if (!controller.signal.aborted) setState("error");
        }
      })();
    });
    return () => controller.abort();
  }, [period, kind, sort, offset, revision]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && offset === 0) setRevision((value) => value + 1);
    };
    const timer = window.setInterval(refresh, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [offset]);
  const items = data.items;

  return (
    <>
      <nav className="nav" aria-label="Hlavní navigace">
        <Link className="brand" href="/" aria-label="TCG Ceny — domů">
          <span className="brand-mark"><span /><span /></span><span>TCG <strong>Ceny</strong></span>
        </Link>
        <div className="nav-links">
          <Link href="/katalog/">Katalog</Link><NavStatusLink kind="drops" current /><Link href="/porovnani/">Porovnání</Link><Link href="/portfolio/">Portfolio</Link><NavStatusLink kind="watching" /><Link className="nav-partner" href="/pro-eshopy/">Pro e-shopy</Link>
        </div>
        <HeaderActions />
      </nav>

      <main className="drops-main shell">
        <header className="drops-hero">
          <div>
            <p className="drops-eyebrow"><span /> Potvrzené pohyby trhu</p>
            <h1>Slevy a<br /><strong>naskladnění.</strong></h1>
            <p>Poklesy cen i návraty do prodeje na jednom místě. Tady najdeš stejné potvrzené události, které odesíláme do veřejných kanálů našeho Discordu.</p>
          </div>
          <div className="drops-trust">
            <ShieldCheck aria-hidden="true" />
            <div><span>Stejné události jako na Discordu</span><small>Nově skladem znamená návrat do online prodeje, ne první přidání do katalogu.</small></div>
          </div>
        </header>

        <section className="drops-toolbar" aria-label="Nastavení přehledu">
          <div className="drops-period drops-kinds" role="group" aria-label="Typ změny">
            {kindOptions.map((option) => <button type="button" key={option.value} aria-pressed={kind === option.value} className={kind === option.value ? "is-active" : undefined} onClick={() => { setKind(option.value); setSort("newest"); setOffset(0); }}>{option.label}</button>)}
          </div>
          <div className="drops-period" aria-label="Období">
            {periodOptions.map((option) => <button type="button" className={period === option.value ? "is-active" : undefined} aria-pressed={period === option.value} onClick={() => { setPeriod(option.value); setOffset(0); }} key={option.value}>{option.label}</button>)}
          </div>
          {kind === "price_drop" && <div className="drops-sort">
            <button type="button" aria-pressed={sort === "newest"} className={sort === "newest" ? "is-active" : undefined} onClick={() => { setSort("newest"); setOffset(0); }}>Nejnovější</button>
            <button type="button" aria-pressed={sort === "largest"} className={sort === "largest" ? "is-active" : undefined} onClick={() => { setSort("largest"); setOffset(0); }}>Největší pokles</button>
          </div>}
        </section>

        {state === "ready" && data.items.length > 0 && (
          <section className="drops-summary" aria-label="Souhrn změn">
            <div><span>Potvrzených událostí</span><strong>{data.total}</strong><small>za zvolené období a typ změny</small></div>
            <div><span>Zobrazený přehled</span><strong>{kindOptions.find((option) => option.value === kind)?.label}</strong><small>{periodOptions.find((option) => option.value === period)?.label}</small></div>
            <div><span>Společný zdroj</span><strong>Web + Discord</strong><small>obnova první stránky každých 5 minut</small></div>
          </section>
        )}

        {state === "loading" && <BrandedLoader className="drops-state" label="Načítám potvrzené změny" detail="Kontroluji poslední bezpečně doručené události." longDetail="Ověřené události se načítají déle než obvykle. Nic nepotvrzeného nezobrazíme." />}
        {state === "error" && <section className="drops-state"><RefreshCw aria-hidden="true" /><h2>Přehled se teď nepodařilo načíst</h2><p>Katalog dál funguje. Zkus přehled za chvíli obnovit.</p><button type="button" onClick={() => setRevision((value) => value + 1)}>Zkusit znovu</button></section>}
        {state === "ready" && data.items.length === 0 && <section className="drops-state drops-empty"><Sparkles aria-hidden="true" /><h2>Pro tento výběr zatím žádné potvrzené změny</h2><p>Zkus delší období nebo jiný typ změny. Zobrazujeme jen události doručené do veřejných Discord kanálů.</p><Link href="/katalog/">Prohlédnout katalog</Link></section>}

        {state === "ready" && items.length > 0 && (
          <section className="drops-feed" aria-label="Seznam potvrzených změn">
            <div className="drops-section-head"><div><p>Potvrzené události</p><h2>{sort === "largest" ? "Největší poklesy cen" : "Zlevnění a návraty do prodeje"}</h2></div><span>{offset + 1}–{offset + items.length} z {data.total}</span></div>
            <p className="drops-disclaimer">Cena a dostupnost odpovídají okamžiku oznámení na Discordu. Aktuální nabídku ověř v obchodě.</p>
            <div className="drops-list">
              {items.map((item) => {
                const offerUrl = safeShopUrl(item.url);
                const detailPath = embeddedPaths.get(item.product_id) || productPath({ id: item.product_id, name: item.product_name });
                const isNew = Boolean(previousSeenAt)
                  && new Date(item.occurred_at).getTime() > new Date(previousSeenAt || "").getTime();
                return (
                  <article className={`drop-card${item.event_type === "restock" ? " is-restock" : ""}${isNew ? " is-new" : ""}`} key={item.id}>
                    <Link className="drop-image" href={detailPath} aria-label={`Otevřít ${item.product_name}`}><ProductImage item={item} /></Link>
                    <div className="drop-content">
                      <div className="drop-heading"><div><span className="drop-confirmed"><i /> {item.event_type === "restock" ? "Nově skladem" : "Potvrzené zlevnění"}{isNew && <em>Nové</em>}</span><h3><Link href={detailPath}>{item.product_name}</Link></h3></div><time dateTime={item.occurred_at}>{formatMoment(item.occurred_at)}</time></div>
                      <div className="drop-price-line">
                        <div className="drop-prices">{item.event_type === "price_drop" ? <><span>{formatPrice(item.old_price_czk)}</span><ArrowDownRight aria-hidden="true" /></> : <PackageCheck aria-hidden="true" />}<strong>{formatPrice(item.new_price_czk)}</strong></div>
                        {item.event_type === "price_drop" ? <div className="drop-saving"><strong>−{formatPrice(item.saved_czk)}</strong><span>−{item.drop_percent?.toLocaleString("cs-CZ")} %</span></div> : <div className="drop-restock-label">Znovu v online prodeji</div>}
                      </div>
                      <div className="drop-footer"><span>Oznámeno u <strong>{item.shop}</strong></span><div><Link href={detailPath}>Detail produktu</Link>{offerUrl && <a href={offerUrl} target="_blank" rel="noopener noreferrer">Otevřít nabídku <ArrowUpRight size={15} aria-hidden="true" /></a>}</div></div>
                    </div>
                  </article>
                );
              })}
            </div>
            {data.total > PAGE_SIZE && <nav className="drops-pagination" aria-label="Stránkování změn">
              <button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>Předchozí</button>
              <span>Strana {Math.floor(offset / PAGE_SIZE) + 1} z {Math.ceil(data.total / PAGE_SIZE)}</span>
              <button type="button" disabled={offset + items.length >= data.total} onClick={() => setOffset(offset + PAGE_SIZE)}>Další</button>
            </nav>}
          </section>
        )}
      </main>
    </>
  );
}
