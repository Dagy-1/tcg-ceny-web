"use client";

import Link from "next/link";
import { ArrowDown, Bell, Check, ExternalLink, Package, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AuthMenu from "../AuthMenu";
import BrandedLoader from "../BrandedLoader";
import MobileNav from "../MobileNav";
import NavStatusLink, { notifyAlertsRead } from "../NavStatusLink";
import { productPath } from "../katalog/catalog-model";
import { safeShopUrl } from "../shop-url";
import { WatchingPreview } from "../FeaturePreview";
import WatchingPriceSummary from "./WatchingPriceSummary";

type SessionUser = {
  id: string;
  username: string;
};

type AlertItem = {
  product: {
    id: string;
    name: string;
    image_url: string | null;
    availability: "online" | "store" | "unavailable" | "unknown";
    best_price_czk: number | null;
    checked_at: string | null;
    data_stale: boolean;
  };
  kinds: Array<"price_below" | "restock">;
  threshold_czk: number | null;
  channel: "discord" | "web";
  shops: string[];
  price_gap_czk: number | null;
  target_reached: boolean;
  updated_at: string;
};

type AlertList = {
  items: AlertItem[];
  total: number;
  price_count: number;
  restock_count: number;
  target_reached_count: number;
};

type AlertEvent = {
  id: string;
  product: AlertItem["product"];
  kind: "price_below" | "restock";
  channel: "discord" | "web";
  status: "ready" | "read" | "pending" | "sending" | "sent" | "failed" | "dead" | "suppressed";
  old_price_czk: number | null;
  new_price_czk: number | null;
  threshold_czk: number | null;
  shop: string | null;
  offer_url: string | null;
  observed_at: string;
  created_at: string;
  read_at: string | null;
};

type AlertEventList = {
  items: AlertEvent[];
  total: number;
  unread: number;
};

type PageState = "loading" | "anonymous" | "ready" | "error";

const emptyList: AlertList = {
  items: [],
  total: 0,
  price_count: 0,
  restock_count: 0,
  target_reached_count: 0,
};

const emptyEvents: AlertEventList = { items: [], total: 0, unread: 0 };

const previewProduct: AlertItem["product"] = {
  id: "pm:me05-pitch-black-etb",
  name: "ME05 Pitch Black ETB",
  image_url: "/catalog-products/978abcdf7fd3af65.png?v=4",
  availability: "online",
  best_price_czk: 1599,
  checked_at: "2026-08-25T20:20:00+02:00",
  data_stale: false,
};

const previewAlerts: AlertList = {
  items: [{
    product: previewProduct,
    kinds: ["price_below", "restock"],
    threshold_czk: 1620,
    channel: "discord",
    shops: [],
    price_gap_czk: 0,
    target_reached: true,
    updated_at: "2026-08-25T20:20:00+02:00",
  }],
  total: 1,
  price_count: 1,
  restock_count: 1,
  target_reached_count: 1,
};

const previewEvents: AlertEventList = {
  items: [{
    id: "local-alert-preview",
    product: previewProduct,
    kind: "price_below",
    channel: "discord",
    status: "sent",
    old_price_czk: 1799,
    new_price_czk: 1599,
    threshold_czk: 1620,
    shop: "Tolarie",
    offer_url: "https://www.tolarie.cz/",
    observed_at: "2026-08-25T20:20:00+02:00",
    created_at: "2026-08-25T20:20:00+02:00",
    read_at: null,
  }],
  total: 1,
  unread: 1,
};

function formatPrice(value: number | null) {
  if (value === null) return "Není dostupná";
  return `${new Intl.NumberFormat("cs-CZ").format(value)} Kč`;
}

function availabilityLabel(value: AlertItem["product"]["availability"]) {
  if (value === "online") return "Skladem online";
  if (value === "store") return "Pouze na prodejně";
  if (value === "unavailable") return "Momentálně vyprodáno";
  return "Dostupnost se ověřuje";
}

function formatCheckedAt(value: string | null) {
  if (!value) return "Kontrola zatím není dostupná";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Kontrola zatím není dostupná";
  return `Zkontrolováno ${new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed)}`;
}

function formatEventAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Čas není dostupný";
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function shopScopeLabel(shops: string[]) {
  const count = new Set(shops).size;
  if (!count) return "Všechny ověřené obchody";
  return `Hlídáš ${count} ${count === 1 ? "obchod" : count < 5 ? "obchody" : "obchodů"}`;
}

function DeliveryMark({ channel }: { channel: AlertItem["channel"] }) {
  return channel === "web" ? <Bell size={12} aria-hidden="true" /> : (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7.3 6.8a15.7 15.7 0 0 1 9.4 0c2 2.8 2.6 5.6 2.3 8.2a12 12 0 0 1-4.1 2.2l-1-1.3c.8-.3 1.5-.7 2.1-1.2a9.4 9.4 0 0 1-8 0c.6.5 1.3.9 2.1 1.2l-1 1.3A12 12 0 0 1 5 15c-.3-2.6.3-5.4 2.3-8.2Zm2.2 4.4c-.8 0-1.4.7-1.4 1.5s.6 1.5 1.4 1.5 1.4-.7 1.4-1.5-.6-1.5-1.4-1.5Zm5 0c-.8 0-1.4.7-1.4 1.5s.6 1.5 1.4 1.5 1.4-.7 1.4-1.5-.6-1.5-1.4-1.5Z" />
    </svg>
  );
}

function WatchingProductImage({ product }: { product: AlertItem["product"] }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = product.image_url?.trim() || "";

  if (!source || failedSource === source) {
    return <span aria-label="Obrázek produktu není dostupný">TCG</span>;
  }

  return (
    // The Worker replaces shop hotlinks with a cached catalog image whenever available.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={source}
      alt={product.name}
      loading="lazy"
      onError={() => setFailedSource(source)}
    />
  );
}

export default function SledovaniClient() {
  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<AlertList>(emptyList);
  const [events, setEvents] = useState<AlertEventList>(emptyEvents);
  const [previewMode, setPreviewMode] = useState(false);
  const [freshEventIds, setFreshEventIds] = useState<Set<string>>(new Set());
  const [loginOpen, setLoginOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    setState("loading");
    try {
      const sessionResponse = await fetch("/api/session", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const session = sessionResponse.ok
        ? await sessionResponse.json() as { user: SessionUser | null }
        : { user: null };
      if (!session.user) {
        setState("anonymous");
        setData(emptyList);
        return;
      }

      const [response, eventsResponse] = await Promise.all([
        fetch("/api/alerts", {
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
        fetch("/api/alerts/events", {
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
      ]);
      if (!response.ok || !eventsResponse.ok) throw new Error("Alerts unavailable");
      const nextData = await response.json() as AlertList;
      const nextEvents = await eventsResponse.json() as AlertEventList;
      setData(nextData);
      setEvents(nextEvents);
      setFreshEventIds(new Set(
        nextEvents.items
          .filter((event) => event.channel === "web" && event.read_at === null)
          .map((event) => event.id),
      ));
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    const previewVariant = new URLSearchParams(window.location.search).get("nahled-alertu");
    const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname)
      && ["1", "karta", "stavy"].includes(previewVariant || "");
    if (isLocalPreview) {
      queueMicrotask(() => {
        setPreviewMode(true);
        const card = {
          ...previewAlerts.items[0],
          product: { ...previewProduct, best_price_czk: 1799 },
          price_gap_czk: 179,
          target_reached: false,
        };
        const previewItems: AlertItem[] = previewVariant === "stavy" ? [
          card,
          { ...card, product: { ...card.product, id: "local-no-price", name: "Ukázka: cena není dostupná", best_price_czk: null, availability: "unknown", checked_at: null, data_stale: true }, price_gap_czk: null },
          { ...card, product: { ...card.product, id: "local-restock", name: "Ukázka: pouze naskladnění" }, kinds: ["restock"], threshold_czk: null, price_gap_czk: null, channel: "web" },
          { ...previewAlerts.items[0], product: { ...previewProduct, id: "local-reached", name: "Ukázka: cíl splněn" } },
        ] : [card];
        setData(previewVariant === "1" ? previewAlerts : { items: previewItems, total: previewItems.length, price_count: previewItems.filter(item => item.kinds.includes("price_below")).length, restock_count: previewItems.length, target_reached_count: previewItems.filter(item => item.target_reached).length });
        setEvents(previewVariant === "1" ? previewEvents : emptyEvents);
        setFreshEventIds(new Set(previewVariant === "1" ? previewEvents.items.map((event) => event.id) : []));
        setState("ready");
      });
      return;
    }
    queueMicrotask(() => void loadAlerts());
  }, [loadAlerts]);

  useEffect(() => {
    if (previewMode || state !== "ready" || events.unread < 1) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch("/api/alerts/events/read", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }).then((response) => {
        if (!response.ok) return;
        setEvents((current) => ({
          ...current,
          unread: 0,
          items: current.items.map((event) => event.read_at ? event : ({ ...event, read_at: new Date().toISOString() })),
        }));
        notifyAlertsRead();
      }).catch(() => undefined);
    }, 1400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [events.unread, previewMode, state]);

  const removeAlert = async (productId: string) => {
    // Local visual fixtures never mutate a real rule or call production APIs.
    if (previewMode) {
      setConfirmId(null);
      return;
    }
    setRemovingId(productId);
    try {
      const response = await fetch(`/api/alerts/${encodeURIComponent(productId)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Delete failed");
      setConfirmId(null);
      await loadAlerts();
    } catch {
      setState("error");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <nav className="nav watching-nav" aria-label="Hlavní navigace">
        <Link className="brand" href="/" aria-label="TCG Ceny — domů">
          <span className="brand-mark"><span /><span /></span>
          <span>TCG <strong>Ceny</strong></span>
        </Link>
        <div className="nav-links">
          <Link href="/katalog/">Katalog</Link>
          <NavStatusLink kind="drops" />
          <Link href="/porovnani/">Porovnání</Link>
          <Link href="/portfolio/">Portfolio</Link>
          <NavStatusLink kind="watching" current />
          <Link href="/pro-eshopy/">Pro e-shopy</Link>
        </div>
        <div className="nav-actions"><MobileNav /><AuthMenu /></div>
      </nav>

      <main className={`watching-main shell${state === "anonymous" ? " is-onboarding" : ""}`}>
        <header className="watching-hero">
          <div>
            <p className="watching-eyebrow"><span /> Osobní přehled</p>
            <h1>Co sleduješ.<br /><strong>Bez hledání a nejistoty.</strong></h1>
            <p>Aktuální ceny, dostupnost a vzdálenost od tvého limitu na jednom místě.</p>
          </div>
          {state === "ready" && (
            <button className="watching-refresh" type="button" onClick={() => previewMode ? undefined : void loadAlerts()}>
              {previewMode ? <Check size={17} aria-hidden="true" /> : <RefreshCw size={17} aria-hidden="true" />}
              {previewMode ? "Lokální náhled" : "Obnovit"}
            </button>
          )}
        </header>

        {state === "loading" && (
          <BrandedLoader
            className="watching-state"
            label="Načítám tvoje sledování"
            detail="Kontroluji uložené limity a aktuální nabídky."
            longDetail="Centrální služba se probouzí. Uložená sledování zůstávají v bezpečí."
          />
        )}

        {state === "anonymous" && (
          <section className="feature-preview watching-intro" aria-labelledby="watching-intro-title">
            <div className="feature-preview-copy">
            <span className="feature-preview-label">TVŮJ OSOBNÍ HLÍDAČ</span>
            <h2 id="watching-intro-title">Vyber si box.<br />Kontroly nech na nás.</h2>
            <p>Nemusíš každý den otevírat stejné obchody. Sleduj cenu i návrat do skladu na jednom místě.</p>
            <ol className="feature-steps">
              <li><span>1</span><div><strong>Najdi svůj produkt</strong><small>V katalogu otevři detail a klikni na zvoneček.</small></div></li>
              <li><span>2</span><div><strong>Řekni nám, co hlídat</strong><small>Cenový limit, naskladnění, nebo obojí.</small></div></li>
              <li><span>3</span><div><strong>Měj změny pod kontrolou</strong><small>V osobním přehledu, případně přes propojený Discord.</small></div></li>
            </ol>
            <div className="watching-login">
              <button type="button" aria-expanded={loginOpen} aria-controls="watching-signin-options" onClick={() => setLoginOpen((value) => !value)}>
                Přihlásit se a začít hlídat <span aria-hidden="true">⌄</span>
              </button>
              {loginOpen && (
                <div className="watching-login-options" id="watching-signin-options">
                  <a href="/api/auth/discord?return_to=%2Fsledovani%2F">Discord</a>
                  <a href="/api/auth/google?return_to=%2Fsledovani%2F">Google</a>
                </div>
              )}
            </div>
            <small className="feature-preview-note">Soukromý přehled · vidíš jen svoje produkty a limity</small>
            <Link className="feature-catalog-link" href="/katalog/">Nejdřív si prohlédnout katalog →</Link>
            </div>
            <WatchingPreview />
          </section>
        )}

        {state === "error" && (
          <section className="watching-state">
            <h2>Sledování se teď nepodařilo načíst</h2>
            <p>Nic se neztratilo. Zkus načtení bezpečně zopakovat.</p>
            <button className="watching-primary" type="button" onClick={() => void loadAlerts()}>Zkusit znovu</button>
          </section>
        )}

        {state === "ready" && (
          <>
            <section className="watching-summary" aria-label="Souhrn sledování">
              <div><span>Celkem sleduješ</span><strong>{data.total}</strong><small>produktů</small></div>
              <div><span>Cenový limit</span><strong>{data.price_count}</strong><small>aktivních hlídání</small></div>
              <div><span>Naskladnění</span><strong>{data.restock_count}</strong><small>aktivních hlídání</small></div>
              <div className={data.target_reached_count ? "is-reached" : undefined}><span>Cíl splněn</span><strong>{data.target_reached_count}</strong><small>produktů v limitu</small></div>
            </section>

            {data.items.length === 0 ? (
              <section className="watching-state watching-empty">
                <span className="watching-state-icon"><Bell aria-hidden="true" /></span>
                <h2>Zatím nic nesleduješ</h2>
                <p>V katalogu otevři produkt a zvol „Nastavit upozornění“.</p>
                <Link className="watching-primary" href="/katalog/">Vybrat produkt</Link>
              </section>
            ) : (
              <section className="watching-products" aria-label="Sledované produkty">
                <div className="watching-section-head">
                  <div><p className="watching-kicker">Tvoje produkty</p><h2>Aktivní sledování</h2></div>
                  <span>{data.total} {data.total === 1 ? "produkt" : data.total < 5 ? "produkty" : "produktů"}</span>
                </div>
                <div className="watching-list">
                  {data.items.map((item) => {
                    const path = productPath({ id: item.product.id, name: item.product.name });
                    const hasPriceRule = item.kinds.includes("price_below");
                    const latestEvent = events.items.find((event) => event.product.id === item.product.id);
                    const isFreshEvent = latestEvent ? freshEventIds.has(latestEvent.id) : false;
                    const offerUrl = latestEvent ? safeShopUrl(latestEvent.offer_url) : null;
                    const savedAmount = latestEvent?.kind === "price_below"
                      && latestEvent.threshold_czk !== null
                      && latestEvent.new_price_czk !== null
                      ? Math.max(0, latestEvent.threshold_czk - latestEvent.new_price_czk)
                      : null;
                    return (
                      <article className="watching-card" key={`${item.product.id}-${item.channel}`}>
                        <Link className="watching-image" href={path} aria-label={`Otevřít ${item.product.name}`}>
                          <WatchingProductImage product={item.product} />
                        </Link>
                        <div className="watching-card-main">
                          <div className="watching-card-title">
                            <div>
                              <span className={`watching-stock is-${item.product.availability}`}>
                                <i aria-hidden="true" /> {availabilityLabel(item.product.availability)}
                              </span>
                              <h3><Link href={path}>{item.product.name}</Link></h3>
                            </div>
                            <div className="watching-tags" aria-label="Nastavené hlídání a doručování">
                              {item.kinds.includes("restock") && <span className="watching-rule"><Package size={12} aria-hidden="true" />Naskladnění</span>}
                              {hasPriceRule && <span className="watching-rule"><ArrowDown size={12} aria-hidden="true" />Pokles ceny</span>}
                              <span className="watching-channel" title={`Doručování: ${item.channel === "discord" ? "Discord" : "Web"}`}><DeliveryMark channel={item.channel} />{item.channel === "discord" ? "Discord" : "Web"}</span>
                            </div>
                          </div>

                          <WatchingPriceSummary price={item.product.best_price_czk} threshold={hasPriceRule ? item.threshold_czk : null} stale={item.product.data_stale || !item.product.checked_at} />

                          <div className="watching-card-footer">
                            <span className={`watching-verification${item.product.data_stale || !item.product.checked_at ? " is-stale" : ""}`} title={item.shops.length ? item.shops.join(", ") : undefined}>
                              <ShieldCheck size={15} aria-hidden="true" />
                              <span>
                                {shopScopeLabel(item.shops)} · {formatCheckedAt(item.product.checked_at)}{item.product.data_stale ? " · data čekají na obnovení" : ""}
                              </span>
                            </span>
                            <div>
                              <Link href={`${path}?upozorneni=upravit`} aria-label={`Upravit sledování produktu ${item.product.name}`}>Upravit</Link>
                              {confirmId === item.product.id ? (
                                <span className="watching-confirm">
                                  <button type="button" onClick={() => void removeAlert(item.product.id)} disabled={removingId === item.product.id}>
                                    {removingId === item.product.id ? "Odebírám…" : "Ano, odebrat"}
                                  </button>
                                  <button type="button" onClick={() => setConfirmId(null)}>Zrušit</button>
                                </span>
                              ) : (
                                <button className="watching-remove" type="button" onClick={() => setConfirmId(item.product.id)}>
                                  Odebrat
                                </button>
                              )}
                            </div>
                          </div>

                          {latestEvent && (
                            <div className={`watching-result${isFreshEvent ? " is-new" : ""}`} aria-label="Splněný cíl sledování">
                              <span className="watching-result-icon" aria-hidden="true"><Check /></span>
                              <div className="watching-result-copy">
                                <span>
                                  {isFreshEvent && <i className="watching-result-new-dot" aria-hidden="true" />}
                                  {latestEvent.kind === "restock" ? "Produkt je znovu skladem" : "Cena dosáhla tvého limitu"}
                                </span>
                                <strong>Cíl splněn</strong>
                                <small>
                                  {latestEvent.shop || "Ověřený obchod"}
                                  {latestEvent.new_price_czk !== null ? ` · ${formatPrice(latestEvent.new_price_czk)}` : ""}
                                  {savedAmount ? ` · ${formatPrice(savedAmount)} pod limitem` : ""}
                                  {` · ${formatEventAt(latestEvent.observed_at)}`}
                                </small>
                              </div>
                              <div className="watching-result-action">
                                <span>Splněno</span>
                                {offerUrl ? (
                                  <a href={offerUrl} target="_blank" rel="noopener noreferrer">
                                    Otevřít nabídku <ExternalLink size={14} aria-hidden="true" />
                                  </a>
                                ) : (
                                  <Link href={path}>Otevřít detail</Link>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            <p className="watching-delivery-note">
              {previewMode ? "Ukázková data pro kontrolu vzhledu. Tento náhled nic neukládá ani neposílá na Discord." : <>
                Nastavení je bezpečně uložené u tvého účtu. Upozornění vznikne až po dvou shodných kontrolách změny;
                opakovaná kontrola stejnou událost znovu nevytvoří.
              </>}
            </p>
          </>
        )}
      </main>
    </>
  );
}
