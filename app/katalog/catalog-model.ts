export type Availability = "online" | "store" | "unavailable" | "unknown";

export type Offer = {
  shop: string;
  price: number | null;
  url: string;
  status: Availability;
  stale: boolean;
};

export type Product = {
  id: string;
  name: string;
  type: string;
  era: string;
  set: string;
  image: string;
  condition: "sealed" | "opening";
  availability: Availability;
  bestPrice: number | null;
  lastKnownPrice?: number | null;
  lastKnownPriceAt?: number | null;
  availableOffers: number;
  storeOffers: number;
  offers: Offer[];
  checkedAt: number | null;
  verified: boolean;
  releaseDate: string | null;
};

export type ApiOffer = {
  shop: string;
  price_czk: number | null;
  url: string;
  availability: string;
  checked_at: string;
  stale: boolean;
  verified: boolean;
};

export type ApiProduct = {
  id: string;
  name: string;
  image_url: string | null;
  condition_group: string;
  product_type: string | null;
  era: string | null;
  set_name: string | null;
  release_date: string | null;
  availability: string;
  best_price_czk: number | null;
  last_known_price_czk?: number | null;
  last_known_price_at?: string | null;
  available_offers: number;
  store_offers: number;
  checked_at: string | null;
  data_stale: boolean;
  offers?: ApiOffer[];
};

export type CatalogData = {
  generatedAt: string | number;
  productCount: number;
  products: Product[];
};

export function apiAvailability(value: string): Availability {
  if (value === "online" || value === "store" || value === "unavailable") return value;
  return "unknown";
}

function apiTimestamp(value: string | null): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : null;
}

export function productFromApi(product: ApiProduct, fallback?: Product): Product {
  const offers = product.offers
    ? product.offers.map((offer) => ({
        shop: offer.shop,
        price: offer.price_czk,
        url: offer.url,
        status: apiAvailability(offer.availability),
        stale: offer.stale,
      }))
    : fallback?.offers || [];
  return {
    id: product.id,
    name: product.name,
    type: product.product_type || fallback?.type || "Produkt",
    era: product.era || fallback?.era || "Nezařazeno",
    set: product.set_name || fallback?.set || "Nezařazeno",
    image: fallback?.image || product.image_url || "",
    condition: product.condition_group === "sealed" ? "sealed" : "opening",
    availability: apiAvailability(product.availability),
    bestPrice: product.best_price_czk,
    lastKnownPrice: product.last_known_price_czk ?? null,
    lastKnownPriceAt: apiTimestamp(product.last_known_price_at ?? null),
    availableOffers: product.available_offers,
    storeOffers: product.store_offers,
    offers,
    checkedAt: apiTimestamp(product.checked_at),
    verified: product.offers
      ? product.offers.some((offer) => offer.verified && !offer.stale)
      : Boolean(fallback?.verified && !product.data_stale),
    releaseDate: product.release_date,
  };
}

function shortHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, "0").slice(0, 7);
}

export function productSlug(product: Pick<Product, "id" | "name">) {
  const name = product.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return `${name || "produkt"}-${shortHash(product.id)}`;
}

export function productPath(product: Pick<Product, "id" | "name">) {
  return `/produkt/${productSlug(product)}/`;
}
