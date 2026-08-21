"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AuthMenu from "../../AuthMenu";
import MobileNav from "../../MobileNav";
import { productFromApi, type ApiProduct, type Product } from "../../katalog/catalog-model";
import ProductAlertControl from "../../katalog/ProductAlertControl";

function formatPrice(price: number | null) {
  if (price === null) return "Cena není dostupná";
  return `${new Intl.NumberFormat("cs-CZ").format(price)} Kč`;
}

function formatDate(timestamp: number | null) {
  if (!timestamp) return "čas kontroly není dostupný";
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Prague",
  }).format(new Date(timestamp * 1000));
}

function statusLabel(status: Product["availability"]) {
  if (status === "online") return "Skladem online";
  if (status === "store") return "Pouze na prodejně";
  return "Momentálně vyprodáno";
}

function offerStatusLabel(status: Product["availability"]) {
  if (status === "online") return "Skladem";
  if (status === "store") return "Prodejna";
  return "Vyprodáno";
}

function safeOfferUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

export default function ProductPageClient({ initialProduct }: { initialProduct: Product }) {
  const [product, setProduct] = useState(initialProduct);
  const [imageFailed, setImageFailed] = useState(false);
  const [liveState, setLiveState] = useState<"loading" | "live" | "snapshot">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/catalog/products/${encodeURIComponent(initialProduct.id)}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Central catalog unavailable");
        return response.json() as Promise<ApiProduct>;
      })
      .then((freshProduct) => {
        setProduct(productFromApi(freshProduct, initialProduct));
        setLiveState("live");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLiveState("snapshot");
      });
    return () => controller.abort();
  }, [initialProduct]);

  const { availableOffers, unavailableOffers } = useMemo(() => {
    const available = product.offers
      .filter((offer) => offer.status !== "unavailable")
      .sort((left, right) => {
        if (left.status !== right.status) return left.status === "online" ? -1 : 1;
        if (left.stale !== right.stale) return Number(left.stale) - Number(right.stale);
        return (left.price ?? Number.MAX_SAFE_INTEGER) - (right.price ?? Number.MAX_SAFE_INTEGER);
      });
    return {
      availableOffers: available,
      unavailableOffers: product.offers.filter((offer) => offer.status === "unavailable"),
    };
  }, [product]);

  const bestStatus = product.availableOffers > 0 ? "online" : "store";
  const verified = product.verified && availableOffers.some((offer) => !offer.stale);
  const bestOffer = availableOffers.find((offer) => (
    offer.status === bestStatus
    && offer.price === product.bestPrice
    && !offer.stale
    && safeOfferUrl(offer.url)
  ));
  const bestOfferUrl = bestOffer ? safeOfferUrl(bestOffer.url) : null;
  const priceCardContent = <>
    <span className="catalog-price-signal" aria-hidden="true" />
    <div className="catalog-price-copy">
      <span>Nejlepší dostupná cena</span>
      <strong>{formatPrice(product.bestPrice)}</strong>
      {bestOffer && <small>Nejlevněji u {bestOffer.shop}</small>}
    </div>
    <div className="catalog-price-proof">
      <b>{verified ? "Ověřeno" : "Starší údaj"}</b>
      <small>Kontrola {formatDate(product.checkedAt)}</small>
      {bestOfferUrl && <span className="catalog-price-open">Otevřít nabídku <ArrowUpRight size={15} aria-hidden="true" /></span>}
    </div>
  </>;

  return (
    <main className="catalog-page product-page">
      <nav className="nav catalog-nav" aria-label="Hlavní navigace">
        <Link className="brand" href="/" aria-label="TCG Ceny – úvod">
          <span className="brand-mark" aria-hidden="true"><span /><span /></span>
          <span>TCG <strong>Ceny</strong></span>
        </Link>
        <div className="nav-links">
          <Link href="/">Domů</Link>
          <Link className="catalog-nav-active" href="/katalog/">Katalog</Link>
          <Link href="/porovnani/">Porovnání</Link>
          <Link href="/portfolio/">Portfolio</Link>
          <Link href="/pro-eshopy/">Pro e-shopy</Link>
        </div>
        <div className="nav-actions"><AuthMenu /><MobileNav /></div>
      </nav>

      <article className="product-shell shell">
        <Link className="product-back" href="/katalog/"><ArrowLeft size={16} /> Zpět do katalogu</Link>

        <header className="product-hero">
          <div className="product-image-wrap">
            {product.image && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt={product.name} onError={() => setImageFailed(true)} />
            ) : (
              <div className="catalog-image-fallback"><span>TCG</span><small>{product.type}</small></div>
            )}
          </div>
          <div className="product-copy">
            <p className="eyebrow"><span className="live-dot" /> {product.set}</p>
            <h1>{product.name}</h1>
            <p className="product-meta">{product.era} · {product.type} · {product.condition === "sealed" ? "Sběratelský stav" : "Vada obalu"}</p>
            <div className={`catalog-status catalog-status-${product.availability}`}>
              <i aria-hidden="true" /> {statusLabel(product.availability)}
            </div>
            {bestOfferUrl && bestOffer ? (
              <a
                className={`catalog-detail-price catalog-detail-price-link ${verified ? "catalog-price-verified" : ""}`}
                href={bestOfferUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Otevřít nejlevnější nabídku produktu ${product.name} v obchodě ${bestOffer.shop} za ${formatPrice(bestOffer.price)}`}
              >
                {priceCardContent}
              </a>
            ) : (
              <div className={`catalog-detail-price ${verified ? "catalog-price-verified" : ""}`}>
                {priceCardContent}
              </div>
            )}
            <p className={`product-live-state product-live-${liveState}`} aria-live="polite">
              {liveState === "loading" && "Ověřujeme aktuální data…"}
              {liveState === "live" && "Zobrazená data pocházejí z centrálního katalogu."}
              {liveState === "snapshot" && "Centrální data nejsou dostupná; zobrazen je poslední bezpečný snapshot."}
            </p>
            <ProductAlertControl product={product} variant="hero" />
          </div>
        </header>

        <section className="product-offers" aria-labelledby="product-offers-title">
          <div className="catalog-offers-heading">
            <div><span>Porovnání obchodů</span><h2 id="product-offers-title">Dostupné nabídky</h2></div>
            <b>{availableOffers.length}</b>
          </div>
          {availableOffers.length ? availableOffers.map((offer) => {
            const isBest = offer.status === bestStatus && offer.price === product.bestPrice && !offer.stale;
            return (
              <a className={`catalog-offer-row ${isBest ? "catalog-offer-best" : ""}`} href={offer.url} target="_blank" rel="noopener noreferrer" key={`${offer.shop}-${offer.url}`}>
                <div><strong>{offer.shop}</strong><span className={`catalog-offer-status catalog-offer-${offer.status}`}>{offerStatusLabel(offer.status)}{offer.stale ? " · starší údaj" : ""}</span></div>
                <span className={`catalog-best-label${isBest ? "" : " catalog-best-placeholder"}`}>{isBest ? "Nejlepší" : ""}</span>
                <b>{formatPrice(offer.price)}</b><ArrowUpRight className="catalog-offer-open" size={16} aria-hidden="true" />
              </a>
            );
          }) : <p className="catalog-empty-offers">Produkt teď nemá dostupnou nabídku.</p>}

          {unavailableOffers.length > 0 && (
            <details className="catalog-unavailable"><summary>Vyprodané nabídky ({unavailableOffers.length})</summary>
              {unavailableOffers.map((offer) => <a href={offer.url} target="_blank" rel="noopener noreferrer" key={`${offer.shop}-${offer.url}`}><span>{offer.shop}</span><span>{formatPrice(offer.price)}</span></a>)}
            </details>
          )}
        </section>

        <div className="catalog-portfolio-action product-actions">
          <div><span>Pracuj s aktuální hodnotou</span><strong>Přidej produkt do portfolia nebo porovnání.</strong></div>
          <div className="catalog-product-actions">
            <Link href={`/porovnani/?add=${encodeURIComponent(product.id)}`}>Porovnat</Link>
            <Link href={`/portfolio/?add=${encodeURIComponent(product.id)}`}><span aria-hidden="true">+</span> Přidat do portfolia</Link>
          </div>
        </div>
        <p className="catalog-detail-note">Ceny a dostupnost se mohou v e-shopu změnit. Uvedení obchodu neznamená placené pořadí ani partnerství.</p>
      </article>
    </main>
  );
}
