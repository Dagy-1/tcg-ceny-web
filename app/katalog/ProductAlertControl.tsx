"use client";

import {
  Bell,
  BellRing,
  Check,
  CircleDollarSign,
  LockKeyhole,
  LogIn,
  MessageCircle,
  PackageCheck,
  Send,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Product } from "./catalog-model";

type AlertVariant = "icon" | "compact" | "hero";
type AlertMode = "restock" | "price";
type DeliveryChannel = "discord" | "web";
type SessionState = "loading" | "authenticated" | "anonymous";
type SaveState = "idle" | "saving" | "saved" | "error";

type StoredAlert = {
  product: { id: string };
  kinds: Array<"price_below" | "restock">;
  threshold_czk: number | null;
  channel: DeliveryChannel;
  shops: string[];
};

function suggestedPrice(price: number | null) {
  if (price === null) return "";
  return String(Math.max(1, Math.round(price * 0.9 / 10) * 10));
}

function formatPrice(price: number | null) {
  if (price === null) return "bez aktuální ceny";
  return `${new Intl.NumberFormat("cs-CZ").format(price)} Kč`;
}

function AlertSetupDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const [modes, setModes] = useState<Set<AlertMode>>(
    new Set(product.availability === "unavailable" ? ["restock"] : ["restock", "price"]),
  );
  const [targetPrice, setTargetPrice] = useState(suggestedPrice(product.bestPrice));
  const [allShops, setAllShops] = useState(true);
  const [selectedShops, setSelectedShops] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<DeliveryChannel>("discord");
  const [previewNotice, setPreviewNotice] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [showLoginChoices, setShowLoginChoices] = useState(false);
  const [returnTo] = useState(() => {
    if (typeof window === "undefined") return "/";
    const currentPath = `${window.location.pathname}${window.location.search}`;
    return currentPath.startsWith("//") ? "/" : currentPath;
  });
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const firstLoginRef = useRef<HTMLAnchorElement>(null);

  const shops = useMemo(
    () => [...new Set(product.offers.filter((offer) => offer.url).map((offer) => offer.shop))].sort((a, b) => a.localeCompare(b, "cs")),
    [product.offers],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/session", {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => response.ok ? response.json() as Promise<{ user: { id: string; linkedProviders?: string[] } | null }> : { user: null })
      .then(async (data) => {
        if (!data.user) {
          setSessionState("anonymous");
          return;
        }
        const providers = Array.isArray(data.user.linkedProviders) ? data.user.linkedProviders : [];
        setLinkedProviders(providers);
        setChannel(providers.includes("discord") ? "discord" : "web");
        setSessionState("authenticated");
        try {
          const response = await fetch("/api/alerts", {
            cache: "no-store",
            credentials: "include",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });
          if (!response.ok) return;
          const payload = await response.json() as { items?: StoredAlert[] };
          const existing = payload.items?.find((item) => item.product.id === product.id);
          if (!existing) return;
          setModes(new Set(existing.kinds.map((kind) => kind === "price_below" ? "price" : "restock")));
          setTargetPrice(existing.threshold_czk === null ? "" : String(existing.threshold_czk));
          setChannel(existing.channel);
          setAllShops(existing.shops.length === 0);
          setSelectedShops(new Set(existing.shops));
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setSaveMessage("Uložené nastavení se teď nepodařilo načíst.");
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSessionState("anonymous");
      });
    return () => controller.abort();
  }, [product.id]);

  useEffect(() => {
    if (showLoginChoices) firstLoginRef.current?.focus();
  }, [showLoginChoices]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const toggleMode = (mode: AlertMode) => {
    setPreviewNotice(false);
    setModes((current) => {
      const next = new Set(current);
      if (next.has(mode)) next.delete(mode);
      else next.add(mode);
      return next;
    });
  };

  const selectShop = (shop: string) => {
    setPreviewNotice(false);
    setAllShops(false);
    setSelectedShops((current) => {
      const next = new Set(current);
      if (next.has(shop)) next.delete(shop);
      else next.add(shop);
      return next;
    });
  };

  const loginHref = (provider: "discord" | "google") =>
    `/api/auth/${provider}?return_to=${encodeURIComponent(returnTo)}`;

  const saveAlert = async () => {
    if (sessionState !== "authenticated" || saveState === "saving") return;
    setPreviewNotice(false);
    setSaveState("saving");
    setSaveMessage("");
    try {
      const response = await fetch(`/api/alerts/${encodeURIComponent(product.id)}`, {
        method: "PUT",
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          kinds: [...modes].map((mode) => mode === "price" ? "price_below" : "restock"),
          thresholdCzk: modes.has("price") ? Number(targetPrice) : null,
          channel,
          shops: allShops ? [] : [...selectedShops],
        }),
      });
      const payload = response.status === 204 ? {} : await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Upozornění se nepodařilo uložit.");
      setSaveState("saved");
      setPreviewNotice(true);
      setSaveMessage("Sledování je bezpečně uložené v tvém účtu.");
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Upozornění se nepodařilo uložit.");
    }
  };

  return createPortal(
    <div className="alert-layer" role="presentation" onMouseDown={onClose}>
      <section
        className="alert-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`alert-title-${product.id}`}
        ref={dialogRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="alert-header">
          <div className="alert-header-icon" aria-hidden="true"><BellRing /></div>
          <div>
            <span>Sledování</span>
            <h2 id={`alert-title-${product.id}`}>Nastavit upozornění</h2>
            <p>{product.name}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Zavřít nastavení upozornění"><X /></button>
        </header>

        {sessionState === "anonymous" && (
          <aside className="alert-auth-note" aria-label="Přihlášení potřebné pro upozornění">
            <span aria-hidden="true"><LockKeyhole /></span>
            <span><strong>Upozornění jsou dostupná po přihlášení</strong><small>Nastavení si můžeš prohlédnout. Pro jeho budoucí uložení a doručování potřebujeme bezpečně poznat tvůj účet.</small></span>
          </aside>
        )}

        <div className="alert-body">
          <section className="alert-section" aria-labelledby="alert-events-title">
            <div className="alert-section-heading">
              <div><span>01</span><div><h3 id="alert-events-title">Co máme sledovat?</h3><p>Můžeš zapnout oba typy upozornění zároveň.</p></div></div>
            </div>
            <div className="alert-mode-grid">
              <button className={modes.has("restock") ? "is-selected" : ""} type="button" aria-pressed={modes.has("restock")} onClick={() => toggleMode("restock")}>
                <span className="alert-mode-icon"><PackageCheck /></span>
                <span><strong>Naskladnění</strong><small>Jakmile se produkt objeví online</small></span>
                <i>{modes.has("restock") && <Check />}</i>
              </button>
              <button className={modes.has("price") ? "is-selected" : ""} type="button" aria-pressed={modes.has("price")} onClick={() => toggleMode("price")}>
                <span className="alert-mode-icon"><CircleDollarSign /></span>
                <span><strong>Pokles ceny</strong><small>Jakmile cena klesne pod tvůj limit</small></span>
                <i>{modes.has("price") && <Check />}</i>
              </button>
            </div>
          </section>

          <section className={`alert-section alert-price-section${modes.has("price") ? "" : " is-disabled"}`} aria-labelledby="alert-price-title">
            <div className="alert-section-heading">
              <div><span>02</span><div><h3 id="alert-price-title">Cílová cena</h3><p>Aktuálně nejlepší nabídka: <strong>{formatPrice(product.bestPrice)}</strong></p></div></div>
            </div>
            <div className="alert-price-control">
              <label><span>Upozornit při ceně</span><span><input inputMode="numeric" value={targetPrice} disabled={!modes.has("price")} onChange={(event) => { setTargetPrice(event.target.value.replace(/\D/g, "").slice(0, 7)); setPreviewNotice(false); }} aria-label="Cílová cena v korunách" /> Kč</span></label>
              <div aria-label="Rychlá volba cílové ceny">
                {[5, 10, 15].map((discount) => (
                  <button key={discount} type="button" disabled={!modes.has("price") || product.bestPrice === null} onClick={() => { setTargetPrice(String(Math.max(1, Math.round((product.bestPrice || 0) * (1 - discount / 100) / 10) * 10))); setPreviewNotice(false); }}>−{discount} %</button>
                ))}
              </div>
            </div>
          </section>

          <section className="alert-section" aria-labelledby="alert-shops-title">
            <div className="alert-section-heading">
              <div><span>03</span><div><h3 id="alert-shops-title">Které obchody?</h3><p>Sledování může běžet nad celým trhem nebo jen vybranými e-shopy.</p></div></div>
            </div>
            <div className="alert-shop-list">
              <button className={allShops ? "is-selected" : ""} type="button" aria-pressed={allShops} onClick={() => { setAllShops(true); setSelectedShops(new Set()); setPreviewNotice(false); }}><span>Všechny ověřené</span><small>{shops.length || product.availableOffers + product.storeOffers} obchodů</small>{allShops && <Check />}</button>
              {shops.slice(0, 7).map((shop) => <button className={selectedShops.has(shop) ? "is-selected" : ""} type="button" aria-pressed={selectedShops.has(shop)} onClick={() => selectShop(shop)} key={shop}>{shop}{selectedShops.has(shop) && <Check />}</button>)}
            </div>
          </section>

          <section className="alert-section" aria-labelledby="alert-channel-title">
            <div className="alert-section-heading">
              <div><span>04</span><div><h3 id="alert-channel-title">Kam upozornění poslat?</h3><p>Kanál půjde později změnit u každého sledování.</p></div></div>
            </div>
            <div className="alert-channel-grid">
              <button className={channel === "discord" ? "is-selected" : ""} type="button" aria-pressed={channel === "discord"} disabled={sessionState === "authenticated" && !linkedProviders.includes("discord")} onClick={() => { setChannel("discord"); setPreviewNotice(false); }}><MessageCircle /><span><strong>Discord</strong><small>{sessionState === "authenticated" && !linkedProviders.includes("discord") ? "Nejdřív propoj Discord účet" : "Soukromá zpráva od TCG Ceny"}</small></span>{channel === "discord" && <Check />}</button>
              <button className={channel === "web" ? "is-selected" : ""} type="button" aria-pressed={channel === "web"} onClick={() => { setChannel("web"); setPreviewNotice(false); }}><Bell /><span><strong>Webové oznámení</strong><small>V centru upozornění na webu</small></span>{channel === "web" && <Check />}</button>
            </div>
          </section>
        </div>

        <footer className={`alert-footer${sessionState === "anonymous" ? " alert-footer-locked" : ""}`}>
          <div>
            <span className={sessionState === "anonymous" ? "alert-lock-dot" : "alert-preview-dot"} aria-hidden="true">{sessionState === "anonymous" && <LockKeyhole />}</span>
            <span>
              <strong>{sessionState === "anonymous" ? "Pouze pro přihlášené uživatele" : sessionState === "loading" ? "Ověřujeme přihlášení" : "Nastavení patří pouze tvému účtu"}</strong>
              <small>{sessionState === "anonymous" ? "Přihlas se přes Discord nebo Google a upozornění spojíme s tvým účtem." : sessionState === "loading" ? "Za okamžik bude možné pokračovat." : "Uložené produkty najdeš v horním menu pod Sledování."}</small>
            </span>
          </div>
          {sessionState === "anonymous" ? (
            showLoginChoices ? (
              <div className="alert-login-actions" id={`alert-login-options-${product.id}`} aria-label="Vyber způsob přihlášení">
                <a ref={firstLoginRef} className="alert-login-discord" href={loginHref("discord")}><span aria-hidden="true">D</span> Discord</a>
                <a href={loginHref("google")}><span aria-hidden="true">G</span> Google</a>
              </div>
            ) : (
              <button className="alert-login-reveal" type="button" aria-expanded={false} aria-controls={`alert-login-options-${product.id}`} onClick={() => setShowLoginChoices(true)}><LogIn /> Přihlásit se <span aria-hidden="true">›</span></button>
            )
          ) : (
            <button type="button" disabled={sessionState === "loading" || saveState === "saving" || modes.size === 0 || (modes.has("price") && (!targetPrice || Number(targetPrice) <= 0)) || (!allShops && selectedShops.size === 0)} onClick={saveAlert}>{sessionState === "loading" ? <LockKeyhole /> : <Send />} {sessionState === "loading" ? "Ověřuji účet" : saveState === "saving" ? "Ukládám…" : "Uložit upozornění"}</button>
          )}
        </footer>
        {(previewNotice || saveState === "error") && <p className={`alert-preview-notice${saveState === "error" ? " is-error" : ""}`} role="status">{saveState === "error" ? <X /> : <Check />} {saveMessage}</p>}
      </section>
    </div>,
    document.body,
  );
}

export default function ProductAlertControl({ product, variant = "compact" }: { product: Product; variant?: AlertVariant }) {
  const [open, setOpen] = useState(false);
  return <>
    <button
      className={`product-alert-trigger product-alert-${variant}${open ? " is-activated" : ""}`}
      type="button"
      onClick={() => setOpen(true)}
      aria-label={`Nastavit upozornění produktu ${product.name}`}
      title={variant === "icon" ? "Nastavit upozornění" : undefined}
    >
      <span className="product-alert-bell" aria-hidden="true"><Bell /></span>
      {variant !== "icon" && <span><strong>Nastavit upozornění</strong><small>Cenu i naskladnění</small></span>}
      {variant === "hero" && <span className="product-alert-arrow" aria-hidden="true">›</span>}
    </button>
    {open && <AlertSetupDialog product={product} onClose={() => setOpen(false)} />}
  </>;
}
