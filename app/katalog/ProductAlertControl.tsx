"use client";

import {
  Bell,
  BellRing,
  Check,
  CircleDollarSign,
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
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const shops = useMemo(
    () => [...new Set(product.offers.filter((offer) => offer.url).map((offer) => offer.shop))].sort((a, b) => a.localeCompare(b, "cs")),
    [product.offers],
  );

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
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
            <span>Ukázka nové funkce</span>
            <h2 id={`alert-title-${product.id}`}>Nastavit hlídání</h2>
            <p>{product.name}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Zavřít nastavení hlídání"><X /></button>
        </header>

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
              <div><span>03</span><div><h3 id="alert-shops-title">Které obchody?</h3><p>Hlídání může běžet nad celým trhem nebo jen vybranými e-shopy.</p></div></div>
            </div>
            <div className="alert-shop-list">
              <button className={allShops ? "is-selected" : ""} type="button" aria-pressed={allShops} onClick={() => { setAllShops(true); setSelectedShops(new Set()); setPreviewNotice(false); }}><span>Všechny ověřené</span><small>{shops.length || product.availableOffers + product.storeOffers} obchodů</small>{allShops && <Check />}</button>
              {shops.slice(0, 7).map((shop) => <button className={selectedShops.has(shop) ? "is-selected" : ""} type="button" aria-pressed={selectedShops.has(shop)} onClick={() => selectShop(shop)} key={shop}>{shop}{selectedShops.has(shop) && <Check />}</button>)}
            </div>
          </section>

          <section className="alert-section" aria-labelledby="alert-channel-title">
            <div className="alert-section-heading">
              <div><span>04</span><div><h3 id="alert-channel-title">Kam upozornění poslat?</h3><p>Kanál půjde později změnit u každého hlídání.</p></div></div>
            </div>
            <div className="alert-channel-grid">
              <button className={channel === "discord" ? "is-selected" : ""} type="button" aria-pressed={channel === "discord"} onClick={() => { setChannel("discord"); setPreviewNotice(false); }}><MessageCircle /><span><strong>Discord</strong><small>Soukromá zpráva od TCG Ceny</small></span>{channel === "discord" && <Check />}</button>
              <button className={channel === "web" ? "is-selected" : ""} type="button" aria-pressed={channel === "web"} onClick={() => { setChannel("web"); setPreviewNotice(false); }}><Bell /><span><strong>Webové oznámení</strong><small>V centru upozornění na webu</small></span>{channel === "web" && <Check />}</button>
            </div>
          </section>
        </div>

        <footer className="alert-footer">
          <div><span className="alert-preview-dot" /><span><strong>Rozhraní je připravené jako náhled</strong><small>Uložení a odesílání zapojíme v další etapě.</small></span></div>
          <button type="button" disabled={modes.size === 0 || (!allShops && selectedShops.size === 0)} onClick={() => setPreviewNotice(true)}><Send /> Vyzkoušet nastavení</button>
        </footer>
        {previewNotice && <p className="alert-preview-notice" role="status"><Check /> Nastavení vypadá dobře. Zatím jsme ho neuložili ani neposlali.</p>}
      </section>
    </div>,
    document.body,
  );
}

export default function ProductAlertControl({ product, variant = "compact" }: { product: Product; variant?: AlertVariant }) {
  const [open, setOpen] = useState(false);
  return <>
    <button
      className={`product-alert-trigger product-alert-${variant}`}
      type="button"
      onClick={() => setOpen(true)}
      aria-label={`Nastavit hlídání produktu ${product.name}`}
      title={variant === "icon" ? "Nastavit hlídání" : undefined}
    >
      <span className="product-alert-bell" aria-hidden="true"><Bell /></span>
      {variant !== "icon" && <span><strong>Hlídat produkt</strong><small>Cenu i naskladnění</small></span>}
      {variant === "hero" && <span className="product-alert-arrow" aria-hidden="true">›</span>}
    </button>
    {open && <AlertSetupDialog product={product} onClose={() => setOpen(false)} />}
  </>;
}
