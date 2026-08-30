import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const websiteDirectory = resolve(scriptDirectory, "..");
const projectDirectory = resolve(websiteDirectory, "..");
const outputFile = resolve(websiteDirectory, "app", "katalog", "catalog-data.json");
const productImageDirectory = resolve(websiteDirectory, "public", "catalog-products");
const productImageVersion = 4;
const sourceFiles = {
  products: resolve(projectDirectory, "products.json"),
  cache: resolve(projectDirectory, "cache.json"),
  sets: resolve(projectDirectory, "catalog_sets.json"),
};

async function sourceFilesExist() {
  try {
    await Promise.all(Object.values(sourceFiles).map((path) => access(path)));
    return true;
  } catch {
    return false;
  }
}

function normalizeOffer(offer, status) {
  const price = Number(offer?.price_number);
  return {
    shop: String(offer?.shop || ""),
    price: Number.isFinite(price) && price > 0 ? price : null,
    url: String(offer?.url || ""),
    status,
    stale: Boolean(offer?.stale),
  };
}

function sortOffers(offers) {
  return offers.sort((left, right) => {
    if (left.stale !== right.stale) return Number(left.stale) - Number(right.stale);
    if (left.price === null) return 1;
    if (right.price === null) return -1;
    return left.price - right.price || left.shop.localeCompare(right.shop, "cs");
  });
}

function normalizedUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    return `${hostname}${pathname}`;
  } catch {
    return "";
  }
}

function configuredOffersFor(product) {
  return new Map(
    Object.entries(product?.shops || {}).map(([shop, url]) => [
      shop.toLocaleLowerCase("cs"),
      normalizedUrl(url),
    ]),
  );
}

function onlyConfiguredOffers(product, offers) {
  const configured = configuredOffersFor(product);
  return (offers || []).filter((offer) => {
    const expectedUrl = configured.get(String(offer?.shop || "").toLocaleLowerCase("cs"));
    return Boolean(expectedUrl) && expectedUrl === normalizedUrl(offer?.url);
  });
}

if (!(await sourceFilesExist())) {
  await access(outputFile);
  console.log("Catalog source files are unavailable; keeping the committed snapshot.");
  process.exit(0);
}

const [products, cache, catalogSets] = await Promise.all([
  readFile(sourceFiles.products, "utf8").then(JSON.parse),
  readFile(sourceFiles.cache, "utf8").then(JSON.parse),
  readFile(sourceFiles.sets, "utf8").then(JSON.parse),
]);

const releases = new Map(
  catalogSets.map((item) => [`${item.era}\u0000${item.set}`, item.release_date || null]),
);
const cacheProducts = cache.products || {};
const snapshotTimestamp = Date.now() / 1000;
const localProductImages = new Set(
  await readdir(productImageDirectory).catch(() => []),
);

function localImageFor(productId) {
  const filename = `${createHash("sha1").update(String(productId)).digest("hex").slice(0, 16)}.png`;
  return localProductImages.has(filename)
    ? `/catalog-products/${filename}?v=${productImageVersion}`
    : "";
}

const publicProducts = products.map((product) => {
  const market = cacheProducts[product.name] || {};
  const online = onlyConfiguredOffers(product, market.available).map((offer) =>
    normalizeOffer(offer, "online"),
  );
  const storeOnly = onlyConfiguredOffers(product, market.store_only).map((offer) =>
    normalizeOffer(offer, "store"),
  );
  const unavailable = onlyConfiguredOffers(product, market.unavailable).map((offer) =>
    normalizeOffer(offer, "unavailable"),
  );
  const checkedAt = Number(market.checked_at) || null;
  const expired = !checkedAt || snapshotTimestamp - checkedAt > 6 * 60 * 60;
  const unknown = onlyConfiguredOffers(product, market.unknown).map((offer) => normalizeOffer(offer, "unknown"));
  const offers = sortOffers([...online, ...storeOnly, ...unavailable, ...unknown].map((offer) => ({...offer, stale: offer.stale || expired})));
  const freshOnline = offers.filter((offer) => !offer.stale && offer.status === "online");
  const freshStore = offers.filter((offer) => !offer.stale && offer.status === "store");
  const bestOffer = freshOnline.find((offer) => offer.price !== null);
  const lastPriced = offers.find((offer) => offer.price !== null && !offer.stale);
  const availability = freshOnline.length ? "online" : freshStore.length ? "store" : offers.some((offer) => !offer.stale && offer.status === "unavailable") ? "unavailable" : "unknown";
  const verified =
    Boolean(checkedAt) &&
    snapshotTimestamp - checkedAt <= 6 * 60 * 60 &&
    [...online, ...storeOnly].some((offer) => !offer.stale);
  const rawCondition = String(product.condition_group || "").toLocaleLowerCase("cs");

  return {
    id: String(product.id),
    name: String(product.name),
    type: String(product.type || "Produkt"),
    era: String(product.era || ""),
    set: String(product.set || ""),
    image: localImageFor(product.id) || String(product.image || market.image || ""),
    condition:
      rawCondition === "opening" || rawCondition.includes("otev") || rawCondition.includes("vada")
        ? "opening"
        : "sealed",
    availability,
    bestPrice: bestOffer?.price ?? null,
    lastKnownPrice: lastPriced?.price ?? null,
    lastKnownPriceAt: lastPriced ? checkedAt : null,
    availableOffers: freshOnline.length,
    storeOffers: freshStore.length,
    offers,
    checkedAt,
    verified,
    releaseDate: releases.get(`${product.era}\u0000${product.set}`) || null,
  };
});

publicProducts.sort((left, right) => {
  const releaseOrder = String(right.releaseDate || "").localeCompare(
    String(left.releaseDate || ""),
  );
  if (releaseOrder) return releaseOrder;
  if (left.availability !== right.availability) {
    const priority = { online: 0, store: 1, unavailable: 2, unknown: 3 };
    return priority[left.availability] - priority[right.availability];
  }
  if (left.bestPrice === null) return 1;
  if (right.bestPrice === null) return -1;
  return left.bestPrice - right.bestPrice || left.name.localeCompare(right.name, "cs");
});

const output = {
  generatedAt: cache.updated_at || new Date().toISOString(),
  productCount: publicProducts.length,
  products: publicProducts,
};

await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Generated public catalog snapshot with ${publicProducts.length} products.`);
