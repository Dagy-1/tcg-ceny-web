"use client";

import Link from "next/link";
import { Bell, Check, PackageCheck, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AuthMenu from "../AuthMenu";
import MobileNav from "../MobileNav";
import { productPath } from "../katalog/catalog-model";

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

type PageState = "loading" | "anonymous" | "ready" | "error";

const emptyList: AlertList = {
  items: [],
  total: 0,
  price_count: 0,
  restock_count: 0,
  target_reached_count: 0,
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

function progress(item: AlertItem) {
  if (!item.threshold_czk || !item.product.best_price_czk) return 0;
  return Math.max(4, Math.min(100, Math.round((item.threshold_czk / item.product.best_price_czk) * 100)));
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

      const response = await fetch("/api/alerts", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Alerts unavailable");
      setData(await response.json() as AlertList);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadAlerts());
  }, [loadAlerts]);

  const removeAlert = async (productId: string) => {
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
          <Link href="/porovnani/">Porovnání</Link>
          <Link href="/portfolio/">Portfolio</Link>
          <Link href="/sledovani/" aria-current="page">Sledování</Link>
          <Link href="/#funkce">Funkce</Link>
          <Link href="/pro-eshopy/">Pro e-shopy</Link>
        </div>
        <div className="nav-actions"><MobileNav /><AuthMenu /></div>
      </nav>

      <main className="watching-main shell">
        <header className="watching-hero">
          <div>
            <p className="watching-eyebrow"><span /> Osobní přehled</p>
            <h1>Co sleduješ.<br /><strong>Bez hledání a nejistoty.</strong></h1>
            <p>Aktuální ceny, dostupnost a vzdálenost od tvého limitu na jednom místě.</p>
          </div>
          {state === "ready" && (
            <button className="watching-refresh" type="button" onClick={() => void loadAlerts()}>
              <RefreshCw size={17} aria-hidden="true" /> Obnovit
            </button>
          )}
        </header>

        {state === "loading" && (
          <section className="watching-state" aria-live="polite">
            <span className="watching-loader" aria-hidden="true" />
            <h2>Načítám tvoje sledování</h2>
            <p>Kontroluji uložené limity a aktuální nabídky.</p>
          </section>
        )}

        {state === "anonymous" && (
          <section className="watching-state watching-signin">
            <span className="watching-state-icon"><Bell aria-hidden="true" /></span>
            <p className="watching-kicker">Soukromé a synchronizované</p>
            <h2>Přehled je dostupný po přihlášení</h2>
            <p>Každý uživatel vidí jen své produkty a vlastní cenové limity.</p>
            <div className="watching-login">
              <button type="button" onClick={() => setLoginOpen((value) => !value)}>
                Přihlásit se <span aria-hidden="true">⌄</span>
              </button>
              {loginOpen && (
                <div className="watching-login-options">
                  <a href="/api/auth/discord?return_to=%2Fsledovani%2F">Discord</a>
                  <a href="/api/auth/google?return_to=%2Fsledovani%2F">Google</a>
                </div>
              )}
            </div>
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
                            <div className="watching-tags">
                              {item.kinds.includes("restock") && <span>Naskladnění</span>}
                              {hasPriceRule && <span>Pokles ceny</span>}
                              <span>{item.channel === "discord" ? "Discord" : "Web"}</span>
                            </div>
                          </div>

                          <div className="watching-values">
                            <div><span>Aktuální cena</span><strong>{formatPrice(item.product.best_price_czk)}</strong></div>
                            <div><span>Tvůj limit</span><strong>{hasPriceRule ? formatPrice(item.threshold_czk) : "Nenastaven"}</strong></div>
                            <div className={item.target_reached ? "is-reached" : undefined}>
                              <span>Do limitu</span>
                              <strong>{!hasPriceRule ? "—" : item.target_reached ? <><Check size={18} /> Cíl splněn</> : formatPrice(item.price_gap_czk)}</strong>
                            </div>
                          </div>

                          {hasPriceRule && (
                            <div className="watching-progress" aria-label={`Postup k cenovému limitu ${progress(item)} procent`}>
                              <span><i style={{ width: `${progress(item)}%` }} /></span>
                              <small>{item.target_reached ? "Cena je v nastaveném limitu" : `K cíli zbývá ${formatPrice(item.price_gap_czk)}`}</small>
                            </div>
                          )}

                          <div className="watching-card-footer">
                            <span><PackageCheck size={15} aria-hidden="true" /> {item.shops.length ? item.shops.join(", ") : "Všechny ověřené obchody"}</span>
                            <div>
                              <Link href={`${path}?upozorneni=upravit`}>Upravit nastavení</Link>
                              {confirmId === item.product.id ? (
                                <span className="watching-confirm">
                                  <button type="button" onClick={() => void removeAlert(item.product.id)} disabled={removingId === item.product.id}>
                                    {removingId === item.product.id ? "Odebírám…" : "Ano, odebrat"}
                                  </button>
                                  <button type="button" onClick={() => setConfirmId(null)}>Zrušit</button>
                                </span>
                              ) : (
                                <button className="watching-remove" type="button" onClick={() => setConfirmId(item.product.id)}>
                                  <Trash2 size={15} aria-hidden="true" /> Odebrat
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            <p className="watching-delivery-note">
              Nastavení je bezpečně uložené u tvého účtu. Automatické doručování upozornění zapneme až po závěrečném testu proti duplicitám.
            </p>
          </>
        )}
      </main>
    </>
  );
}
