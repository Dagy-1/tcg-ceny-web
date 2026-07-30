"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, PackageCheck, PackageX, X } from "lucide-react";
import AuthMenu from "../AuthMenu";

const PAGE_SIZE = 24;

type Availability = "online" | "store" | "unavailable";
type OfferStatus = Availability;

type Offer = {
  shop: string;
  price: number | null;
  url: string;
  status: OfferStatus;
  stale: boolean;
};

type Product = {
  id: string;
  name: string;
  type: string;
  era: string;
  set: string;
  image: string;
  condition: "sealed" | "opening";
  availability: Availability;
  bestPrice: number | null;
  availableOffers: number;
  storeOffers: number;
  offers: Offer[];
  checkedAt: number | null;
  verified: boolean;
  releaseDate: string | null;
};

export type CatalogData = {
  generatedAt: string | number;
  productCount: number;
  products: Product[];
};

type SortMode = "recommended" | "price-asc" | "price-desc" | "name" | "newest";
type ConditionMode = Product["condition"];

function formatPrice(price: number | null) {
  if (price === null) return "Cena není dostupná";
  return `${new Intl.NumberFormat("cs-CZ").format(price)} Kč`;
}

function formatDate(timestamp: number | null) {
  if (!timestamp) return "Čas kontroly není dostupný";
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Prague",
  }).format(new Date(timestamp * 1000));
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

function offerStatusLabel(status: OfferStatus) {
  if (status === "online") return "Skladem";
  if (status === "store") return "Prodejna";
  return "Vyprodáno";
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

function ProductDetail({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const availableOffers = product.offers
    .filter((offer) => offer.status !== "unavailable")
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === "online" ? -1 : 1;
      if (left.stale !== right.stale) return Number(left.stale) - Number(right.stale);
      return (left.price ?? Number.MAX_SAFE_INTEGER) - (right.price ?? Number.MAX_SAFE_INTEGER);
    });
  const unavailableOffers = product.offers.filter((offer) => offer.status === "unavailable");
  const bestStatus: OfferStatus = product.availableOffers > 0 ? "online" : "store";
  const verified = product.verified && availableOffers.some((offer) => !offer.stale);

  return (
    <div className="catalog-modal-layer" role="presentation" onMouseDown={onClose}>
      <section
        className="catalog-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="catalog-detail-close" type="button" onClick={onClose} aria-label="Zavřít detail">
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>

        <div className="catalog-detail-hero">
          <div className="catalog-detail-copy">
            <span className="catalog-kicker">TCG Ceny · {product.type}</span>
            <h2 id="product-detail-title">{product.name}</h2>
            <p>{product.era} · {product.set} · {product.type}</p>
            <div className={`catalog-status catalog-status-${product.availability}`}>
              <i aria-hidden="true" />
              {statusLabel(product.availability)}
            </div>
          </div>
          <div className="catalog-detail-image">
            <ProductImage product={product} />
          </div>
        </div>

        <div className={`catalog-detail-price ${verified ? "catalog-price-verified" : ""}`}>
          <span className="catalog-price-signal" aria-hidden="true" />
          <div className="catalog-price-copy">
            <span>Nejlepší dostupná cena</span>
            <strong>{formatPrice(product.bestPrice)}</strong>
          </div>
          <div className="catalog-price-proof">
            <b>{verified ? "Ověřeno" : "Starší údaj"}</b>
            <small>Kontrola {formatDate(product.checkedAt)}</small>
          </div>
        </div>

        <div className="catalog-detail-facts" aria-label="Souhrn dostupnosti">
          <span><b>{product.availableOffers}</b> online</span>
          <span><b>{product.storeOffers}</b> prodejna</span>
          <span><b>{unavailableOffers.length}</b> vyprodáno</span>
        </div>

        <div className="catalog-offers">
          <div className="catalog-offers-heading">
            <div>
              <span>Porovnání obchodů</span>
              <h3>Dostupné nabídky</h3>
            </div>
            <b>{availableOffers.length}</b>
          </div>
          {availableOffers.length ? (
            availableOffers.map((offer) => {
              const isBest =
                offer.status === bestStatus &&
                offer.price === product.bestPrice &&
                !offer.stale;
              return (
                <a
                  className={`catalog-offer-row ${isBest ? "catalog-offer-best" : ""}`}
                  href={offer.url}
                  target="_blank"
                  rel="noreferrer"
                  key={`${offer.shop}-${offer.url}`}
                >
                  <div>
                    <strong>{offer.shop}</strong>
                    <span className={`catalog-offer-status catalog-offer-${offer.status}`}>
                      {offerStatusLabel(offer.status)}{offer.stale ? " · starší údaj" : ""}
                    </span>
                  </div>
                  <span
                    className={`catalog-best-label${isBest ? "" : " catalog-best-placeholder"}`}
                    aria-hidden={!isBest}
                  >
                    {isBest ? "Nejlepší" : ""}
                  </span>
                  <b>{formatPrice(offer.price)}</b>
                  <span className="catalog-offer-open" aria-hidden="true">↗</span>
                </a>
              );
            })
          ) : (
            <p className="catalog-empty-offers">Produkt teď nemá dostupnou nabídku.</p>
          )}

          {unavailableOffers.length > 0 && (
            <details className="catalog-unavailable">
              <summary>Vyprodané nabídky ({unavailableOffers.length})</summary>
              {unavailableOffers.map((offer) => (
                <a href={offer.url} target="_blank" rel="noreferrer" key={`${offer.shop}-${offer.url}`}>
                  <span>{offer.shop}</span>
                  <span>{formatPrice(offer.price)}</span>
                </a>
              ))}
            </details>
          )}
        </div>

        <div className="catalog-portfolio-action">
          <div>
            <span>Už ho máš ve sbírce?</span>
            <strong>Sleduj jeho hodnotu v portfoliu.</strong>
          </div>
          <Link href={`/portfolio/?add=${encodeURIComponent(product.id)}`}>
            <span aria-hidden="true">+</span> Přidat do portfolia
          </Link>
        </div>

        <p className="catalog-detail-note">
          Nabídky řadíme podle dostupnosti a ceny. Uvedení obchodu neznamená placené pořadí
          ani obchodní partnerství.
        </p>
      </section>
    </div>
  );
}

export default function CatalogClient({ data }: { data: CatalogData }) {
  const [query, setQuery] = useState("");
  const [era, setEra] = useState("all");
  const [setName, setSetName] = useState("all");
  const [type, setType] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [condition, setCondition] = useState<ConditionMode>("sealed");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Product | null>(null);

  const eras = useMemo(
    () => [...new Set(data.products.map((product) => product.era))].sort((a, b) => a.localeCompare(b, "cs")),
    [data.products],
  );
  const sets = useMemo(
    () =>
      [...new Set(data.products.filter((product) => era === "all" || product.era === era).map((product) => product.set))]
        .sort((a, b) => a.localeCompare(b, "cs")),
    [data.products, era],
  );
  const types = useMemo(
    () => [...new Set(data.products.map((product) => product.type))].sort((a, b) => a.localeCompare(b, "cs")),
    [data.products],
  );

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    const products = data.products.filter((product) => {
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
  }, [availability, condition, data.products, era, query, setName, sort, type]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const onlineCount = data.products.filter((product) => product.availability === "online").length;
  const sealedCount = data.products.filter((product) => product.condition === "sealed").length;
  const openingCount = data.products.filter((product) => product.condition === "opening").length;
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
          <Link href="/">Domů</Link>
          <Link className="catalog-nav-active" href="/katalog">Katalog</Link>
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/pro-eshopy">Pro e-shopy</Link>
        </div>
        <AuthMenu />
      </nav>

      <header className="catalog-header shell">
        <div>
          <p className="eyebrow"><span className="live-dot" /> Katalog TCG Ceny</p>
          <h1>Najdi produkt.<span>Porovnej český trh.</span></h1>
          <p>
            Aktuální ceny a skladovost zapečetěných Pokémon TCG produktů na jednom místě.
            Bez placeného pořadí a bez zbytečného hledání.
          </p>
        </div>
        <div className="catalog-summary" aria-label="Souhrn katalogu">
          <div><strong>{data.productCount}</strong><span>produktů v katalogu</span></div>
          <div><strong>{onlineCount}</strong><span>právě skladem online</span></div>
          <div><strong>{eras.length}</strong><span>hlavní produktové série</span></div>
        </div>
      </header>

      <section className="catalog-condition shell" aria-labelledby="catalog-condition-title">
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
        <div className="catalog-toolbar">
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
          <p><strong>{filtered.length}</strong> {resultCountLabel(filtered.length)}</p>
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
                <option value="recommended">Doporučené</option>
                <option value="price-asc">Nejnižší cena</option>
                <option value="price-desc">Nejvyšší cena</option>
                <option value="newest">Nejnovější edice</option>
                <option value="name">Název A–Z</option>
              </select>
            </label>
          </div>
        </div>

        {visibleProducts.length ? (
          <div className="catalog-grid">
            {visibleProducts.map((product) => (
              <button
                type="button"
                className={`catalog-card catalog-card-${product.availability}`}
                key={product.id}
                onClick={() => setSelected(product)}
                aria-label={`Otevřít detail produktu ${product.name}`}
              >
                <div className="catalog-card-image">
                  <ProductImage product={product} />
                  <span className="catalog-card-open" aria-hidden="true">
                    <ArrowUpRight />
                  </span>
                </div>
                <div className="catalog-card-body">
                  <div className="catalog-card-meta">
                    <span>{product.set}</span>
                    <b>{product.type}</b>
                  </div>
                  <h2>{product.name}</h2>
                  <p>{product.era}</p>
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
              </button>
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

      {selected && <ProductDetail product={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
