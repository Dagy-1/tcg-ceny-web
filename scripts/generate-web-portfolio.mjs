import { createHash } from "node:crypto";
import { access, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const websiteDirectory = resolve(scriptDirectory, "..");
const projectDirectory = resolve(websiteDirectory, "..");
const outputFile = resolve(websiteDirectory, "app", "portfolio", "portfolio-data.json");
const masterFile = resolve(projectDirectory, "data_master", "portfolio_products.json");
const priceFile = resolve(projectDirectory, "portfolio_market_prices.json");
const catalogFile = resolve(projectDirectory, "products.json");
const productImageDirectory = resolve(websiteDirectory, "public", "catalog-products");
const productImageVersion = 4;

const supportedTypes = new Set([
  "ETB",
  "Pokemon Center ETB",
  "Booster Bundle",
  "Booster Box",
  "Booster Pack",
  "Sleeved Booster Pack",
  "Blister",
  "Checklane Blister",
  "Premium Collection",
  "Special Collection",
  "Ultra Premium Collection",
  "Illustration Collection",
  "Figure Collection",
  "Poster Collection",
  "Binder Collection",
  "Tech Sticker Collection",
  "Tin",
  "Mini Tin",
  "Collector Chest",
  "Build & Battle Box",
  "Build & Battle Stadium",
  "Build & Battle Display",
  "Pin Collection",
  "ex Box",
  "V Box",
  "GX Box",
]);

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

try {
  await Promise.all([access(masterFile), access(priceFile), access(catalogFile)]);
} catch {
  await access(outputFile);
  console.log("Portfolio source files are unavailable; keeping the committed snapshot.");
  process.exit(0);
}

const [masterProducts, priceCache, catalogProducts, localProductImages] = await Promise.all([
  readFile(masterFile, "utf8").then(JSON.parse),
  readFile(priceFile, "utf8").then(JSON.parse),
  readFile(catalogFile, "utf8").then(JSON.parse),
  readdir(productImageDirectory).catch(() => []),
]);
const prices = priceCache.by_id || {};
const usdToCzk = Number(priceCache.usd_to_czk) || 23;
const eurToCzk = Number(priceCache.eur_to_czk) || 24.19;
const localImageNames = new Set(localProductImages);
const seenIds = new Set();
const seenNames = new Set();
const products = [];

const catalogByName = new Map();
for (const product of catalogProducts) {
  for (const value of [product.name, ...(product.aliases || [])]) {
    const key = normalize(value);
    if (!key) continue;
    if (!catalogByName.has(key)) {
      catalogByName.set(key, product);
    } else if (catalogByName.get(key)?.id !== product.id) {
      catalogByName.set(key, null);
    }
  }
}

function matchingCatalogProduct(source) {
  for (const value of [source.name, ...(source.aliases || [])]) {
    const product = catalogByName.get(normalize(value));
    if (product && (!source.type || !product.type || source.type === product.type)) {
      return product;
    }
  }
  return null;
}

function localCatalogImage(product) {
  if (!product?.id) return "";
  const filename = `${createHash("sha1").update(String(product.id)).digest("hex").slice(0, 16)}.png`;
  return localImageNames.has(filename)
    ? `/catalog-products/${filename}?v=${productImageVersion}`
    : "";
}

for (const source of masterProducts) {
  const id = String(source.id || "").trim();
  const name = String(source.name || "").trim();
  const type = String(source.type || "").trim();
  const nameKey = normalize(name);
  if (!id || !name || !nameKey || seenIds.has(id) || seenNames.has(nameKey)) continue;
  if (type && !supportedTypes.has(type)) continue;

  const cached = prices[id] || {};
  const cachedPrice = Number(cached.price_czk);
  const sourceUsd = Number(source.market_value_usd ?? source.pricing?.market_value_usd);
  const sourceEur = Number(
    source.market_value_eur ??
    (String(source.pricing?.currency || "").toUpperCase() === "EUR"
      ? source.pricing?.trend ?? source.pricing?.average
      : null),
  );
  const marketPrice = Number.isFinite(cachedPrice) && cachedPrice > 0
    ? Math.round(cachedPrice)
    : Number.isFinite(sourceUsd) && sourceUsd > 0
      ? Math.round(sourceUsd * usdToCzk)
      : Number.isFinite(sourceEur) && sourceEur > 0
        ? Math.round(sourceEur * eurToCzk)
      : null;
  const releaseTimestamp = Date.parse(String(source.release_date || ""));
  const releaseDate = Number.isFinite(releaseTimestamp)
    ? new Date(releaseTimestamp).toISOString().slice(0, 10)
    : "";
  const catalogProduct = matchingCatalogProduct(source);

  seenIds.add(id);
  seenNames.add(nameKey);
  products.push({
    id,
    name,
    type: type || "Produkt",
    era: String(source.era || ""),
    set: String(source.set || ""),
    image:
      localCatalogImage(catalogProduct) ||
      String(source.image_url || source.image || catalogProduct?.image || ""),
    marketPrice,
    priceUpdatedAt: marketPrice
      ? String(
          cached.updated_at ||
          source.pricing?.snapshot_created_at ||
          priceCache.updated_at ||
          "",
        )
      : "",
    releaseDate,
  });
}

products.sort((left, right) =>
  right.releaseDate.localeCompare(left.releaseDate) ||
  left.name.localeCompare(right.name, "cs"),
);

const snapshot = {
  generatedAt: new Date().toISOString(),
  sourceUpdatedAt: String(priceCache.updated_at || ""),
  productCount: products.length,
  products,
};

await writeFile(outputFile, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Generated portfolio snapshot with ${products.length} products.`);
