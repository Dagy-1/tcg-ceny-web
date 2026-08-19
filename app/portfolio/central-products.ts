export type PortfolioProduct = {
  id: string;
  name: string;
  type: string;
  era: string;
  set: string;
  image: string;
  marketPrice: number | null;
  priceUpdatedAt: string;
};

type CentralMarketPrice = {
  price_czk: number;
  priced_on: string;
  observed_at: string | null;
};

type CentralPortfolioProduct = {
  id: string;
  name: string;
  image_url: string | null;
  product_type: string | null;
  era: string | null;
  set_name: string | null;
  latest_market_price: CentralMarketPrice | null;
};

type CentralPortfolioProductPage = {
  items: CentralPortfolioProduct[];
  total: number;
  limit: number;
  offset: number;
};

function fromCentral(product: CentralPortfolioProduct, fallback?: PortfolioProduct): PortfolioProduct {
  const price = product.latest_market_price;
  return {
    id: product.id,
    name: product.name,
    type: product.product_type || fallback?.type || "Produkt",
    era: product.era || fallback?.era || "",
    set: product.set_name || fallback?.set || "",
    image: fallback?.image || product.image_url || "",
    marketPrice: price?.price_czk ?? null,
    priceUpdatedAt: price?.observed_at || price?.priced_on || "",
  };
}

async function staticFallbackProducts(initial: PortfolioProduct[], signal?: AbortSignal) {
  try {
    const response = await fetch("/portfolio-products.json", {
      cache: "force-cache",
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) return initial;
    const snapshot = await response.json() as { products?: PortfolioProduct[] };
    return Array.isArray(snapshot.products) && snapshot.products.length ? snapshot.products : initial;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return initial;
  }
}

export async function loadPortfolioProducts(initial: PortfolioProduct[], signal?: AbortSignal) {
  const fallback = await staticFallbackProducts(initial, signal);
  const fallbackById = new Map(fallback.map((product) => [product.id, product]));
  try {
    const items: CentralPortfolioProduct[] = [];
    let total = 1;
    for (let offset = 0; offset < total; offset += 500) {
      const response = await fetch(`/api/portfolio/products?limit=500&offset=${offset}`, {
        headers: { Accept: "application/json" },
        signal,
      });
      if (!response.ok) throw new Error("Central portfolio products are unavailable");
      const page = await response.json() as CentralPortfolioProductPage;
      if (!Array.isArray(page.items) || !Number.isInteger(page.total) || page.total < 0) {
        throw new Error("Central portfolio products returned an invalid response");
      }
      total = page.total;
      items.push(...page.items);
    }
    if (items.length !== total || (fallback.length > 0 && total < fallback.length)) {
      throw new Error("Central portfolio products response is incomplete");
    }
    return items.map((product) => fromCentral(product, fallbackById.get(product.id)));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return fallback;
  }
}
