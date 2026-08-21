"use client";

import { CheckCircle2, Flag, LockKeyhole, LogIn, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Offer, Product } from "./catalog-model";

type IssueType = "price" | "availability" | "link" | "name" | "edition" | "image" | "duplicate" | "other";
type SessionState = "loading" | "authenticated" | "anonymous";

const PRODUCT_ISSUES: Array<{ value: IssueType; label: string; hint: string }> = [
  { value: "name", label: "Chybný název", hint: "Produkt nebo varianta má jiný název." },
  { value: "edition", label: "Špatná edice", hint: "Produkt patří do jiné série nebo edice." },
  { value: "image", label: "Nesprávný obrázek", hint: "Obrázek neodpovídá produktu." },
  { value: "duplicate", label: "Duplicitní produkt", hint: "Stejný produkt je v katalogu vícekrát." },
  { value: "other", label: "Jiný problém", hint: "Něco dalšího není v pořádku." },
];

const OFFER_ISSUES: Array<{ value: IssueType; label: string; hint: string }> = [
  { value: "price", label: "Nesprávná cena", hint: "Cena na e-shopu je jiná." },
  { value: "availability", label: "Chybná skladovost", hint: "Nabídka je skladem nebo vyprodaná jinak." },
  { value: "link", label: "Nefunkční odkaz", hint: "Odkaz nevede na správnou nabídku." },
  { value: "other", label: "Jiný problém", hint: "Něco dalšího není v pořádku." },
];

function IssueDialog({ product, offer, onClose }: { product: Product; offer?: Offer; onClose: () => void }) {
  const options = offer ? OFFER_ISSUES : PRODUCT_ISSUES;
  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [showLoginChoices, setShowLoginChoices] = useState(false);
  const [returnTo] = useState(() => {
    if (typeof window === "undefined") return "/";
    const currentPath = `${window.location.pathname}${window.location.search}`;
    return currentPath.startsWith("//") ? "/" : currentPath;
  });
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const firstLoginRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/session", {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => response.ok ? response.json() as Promise<{ user: { id: string } | null }> : { user: null })
      .then((data) => setSessionState(data.user ? "authenticated" : "anonymous"))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSessionState("anonymous");
      });
    return () => controller.abort();
  }, []);

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
        'a[href], button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

  const submit = async () => {
    if (!issueType || state === "sending" || sessionState !== "authenticated") return;
    setState("sending");
    setMessage("");
    try {
      const response = await fetch("/api/catalog/reports", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          issue_type: issueType,
          note: note.trim(),
          ...(offer ? {
            shop: offer.shop,
            offer_url: offer.url,
            displayed_price_czk: offer.price,
            displayed_availability: offer.status,
          } : {}),
        }),
      });
      const payload = await response.json().catch(() => ({})) as { detail?: string; error?: string; created?: boolean };
      if (response.status === 401) setSessionState("anonymous");
      if (!response.ok) throw new Error(payload.detail || payload.error || "Hlášení se nepodařilo odeslat.");
      setMessage(payload.created === false
        ? "Tento problém už kontrolujeme. Tvoje potvrzení jsme k němu přidali."
        : "Děkujeme. Hlášení jsme přijali a předali ke kontrole.");
      setState("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Hlášení se nepodařilo odeslat.");
      setState("error");
    }
  };

  const loginHref = (provider: "discord" | "google") =>
    `/api/auth/${provider}?return_to=${encodeURIComponent(returnTo)}`;

  return createPortal(
    <div className="report-layer" role="presentation" onMouseDown={onClose}>
      <section className="report-dialog" role="dialog" aria-modal="true" aria-labelledby={`report-title-${product.id}`} ref={dialogRef} onMouseDown={(event) => event.stopPropagation()}>
        <header className="report-header">
          <span className="report-header-icon" aria-hidden="true"><Flag /></span>
          <div><span>Pomoz nám zlepšit katalog</span><h2 id={`report-title-${product.id}`}>Nahlásit problém</h2><p>{offer ? `${product.name} · ${offer.shop}` : product.name}</p></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Zavřít hlášení"><X /></button>
        </header>

        {sessionState === "anonymous" && (
          <aside className="report-auth-note" aria-label="Přihlášení potřebné pro hlášení">
            <span aria-hidden="true"><LockKeyhole /></span>
            <span><strong>Hlášení mohou odesílat pouze přihlášení uživatelé</strong><small>Nastavení si můžeš prohlédnout. Pro odeslání potřebujeme bezpečně poznat tvůj účet.</small></span>
          </aside>
        )}

        {state === "success" ? (
          <div className="report-success" role="status"><CheckCircle2 aria-hidden="true" /><h3>Hlášení je uložené</h3><p>{message}</p><button type="button" onClick={onClose}>Hotovo</button></div>
        ) : (
          <div className="report-body">
            <fieldset><legend>Co není v pořádku?</legend><div className="report-options">
              {options.map((option) => <button className={issueType === option.value ? "is-selected" : ""} type="button" aria-pressed={issueType === option.value} onClick={() => { setIssueType(option.value); setState("idle"); setMessage(""); }} key={option.value}><span><strong>{option.label}</strong><small>{option.hint}</small></span>{issueType === option.value && <CheckCircle2 aria-hidden="true" />}</button>)}
            </div></fieldset>
            <label className="report-note"><span>Upřesnění <small>nepovinné</small></span><textarea value={note} maxLength={500} rows={3} placeholder="Krátce popiš, co jsi na e-shopu nebo u produktu našel…" onChange={(event) => { setNote(event.target.value); setState("idle"); setMessage(""); }} /><small>{note.length}/500</small></label>
            {state === "error" && <p className="report-error" role="alert">{message}</p>}
            <footer className={`report-footer${sessionState === "anonymous" ? " report-footer-locked" : ""}`}>
              <p>{sessionState === "anonymous" ? "Přihlas se přes Discord nebo Google. Potom můžeš hlášení bezpečně odeslat." : "Hlášení nikdy samo nezmění katalog. Nejprve ho ověříme."}</p>
              {sessionState === "anonymous" ? (
                showLoginChoices ? (
                  <div className="report-login-actions" id={`report-login-options-${product.id}`} aria-label="Vyber způsob přihlášení">
                    <a ref={firstLoginRef} className="report-login-discord" href={loginHref("discord")}><span aria-hidden="true">D</span> Discord</a>
                    <a href={loginHref("google")}><span aria-hidden="true">G</span> Google</a>
                  </div>
                ) : (
                  <button className="report-login-reveal" type="button" aria-expanded={false} aria-controls={`report-login-options-${product.id}`} onClick={() => setShowLoginChoices(true)}><LogIn aria-hidden="true" /> Přihlásit se</button>
                )
              ) : (
                <button type="button" disabled={!issueType || state === "sending" || sessionState === "loading"} onClick={submit}>{sessionState === "loading" ? <LockKeyhole aria-hidden="true" /> : <Send aria-hidden="true" />}{state === "sending" ? "Odesílám…" : sessionState === "loading" ? "Ověřuji účet" : "Odeslat hlášení"}</button>
              )}
            </footer>
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}

export default function CatalogIssueReportControl({ product, offer, variant = "product" }: { product: Product; offer?: Offer; variant?: "product" | "offer" | "corner" }) {
  const [open, setOpen] = useState(false);
  const buttonClass = variant === "offer" ? "catalog-offer-report" : variant === "corner" ? "catalog-product-report-corner" : "catalog-product-report";
  const title = variant === "offer" ? "Nahlásit problém s nabídkou" : variant === "corner" ? "Nahlásit problém s produktem" : undefined;
  return <>
    <button className={buttonClass} type="button" onClick={() => setOpen(true)} aria-label={offer ? `Nahlásit problém s nabídkou obchodu ${offer.shop}` : `Nahlásit problém s produktem ${product.name}`} title={title}><Flag aria-hidden="true" />{variant === "product" && <span>Nahlásit problém</span>}</button>
    {open && <IssueDialog product={product} offer={offer} onClose={() => setOpen(false)} />}
  </>;
}
