import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { handleCatalogApi } from "../worker/catalog-api.ts";
import { canonicalHostRedirect } from "../worker/canonical-host.ts";
import { handleSitemap } from "../worker/sitemap.ts";
import {
  centralPortfolioRequest,
  centralPortfolioProductsRequest,
  handleCatalogReportApi,
  handlePortfolioApi,
  oauthRedirectUri,
} from "../worker/portfolio-api.ts";
import { comparisonSummary, selectionTotal } from "../app/porovnani/comparison.ts";
import catalogData from "../app/katalog/catalog-data.json" with { type: "json" };
import { productPath, productSlug, productFromApi, apiAvailability } from "../app/katalog/catalog-model.ts";
import { safeShopUrl } from "../app/shop-url.ts";

const output = new URL("../out/", import.meta.url);

test("unknown availability and historical prices never become current offers", () => {
  assert.equal(apiAvailability("unknown"), "unknown");
  assert.equal(apiAvailability("unexpected"), "unknown");
  assert.equal(apiAvailability("unavailable"), "unavailable");
  const product = productFromApi({
    id: "test", name: "Test", availability: "unknown", best_price_czk: null,
    last_known_price_czk: 899, last_known_price_at: "2026-07-31T14:29:36Z",
    checked_at: "2026-07-31T14:29:36Z", data_stale: true,
    available_offers: 0, store_offers: 0, offers: [],
  });
  assert.equal(product.availability, "unknown");
  assert.equal(product.bestPrice, null);
  assert.equal(product.availableOffers, 0);
  assert.equal(product.lastKnownPrice, 899);
  assert.equal(product.lastKnownPriceAt, Date.parse("2026-07-31T14:29:36Z") / 1000);
  const missingHistory = productFromApi({id:"test", name:"Test", availability:"online", best_price_czk:null, offers:[]}, {...product, bestPrice:999});
  assert.equal(missingHistory.bestPrice, null);
  assert.equal(missingHistory.lastKnownPrice, null);
});

async function readOutput(path) {
  return readFile(new URL(path, output), "utf8");
}

async function webSessionCookie(payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = Buffer.from(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded)),
  ).toString("base64url");
  return `tcg_session=${encoded}.${signature}`;
}

test("static export contains every public page", async () => {
  await Promise.all([
    access(new URL("index.html", output)),
    access(new URL("katalog/index.html", output)),
    access(new URL("zlevneni/index.html", output)),
    access(new URL("porovnani/index.html", output)),
    access(new URL("portfolio/index.html", output)),
    access(new URL("sledovani/index.html", output)),
    access(new URL("portfolio-products.json", output)),
    access(new URL("pro-eshopy/index.html", output)),
    access(new URL("podminky-pouziti/index.html", output)),
    access(new URL("soukromi-a-cookies/index.html", output)),
    access(new URL("sitemap.xml", output)),
    access(new URL("robots.txt", output)),
    access(new URL("tcg-cursor.svg", output)),
    access(new URL("tcg-cursor-active.svg", output)),
    ...[
      "alza", "bulbazard", "geek-hall", "kitstore", "knihy-dobrovsky", "najada",
      "pikastore", "pokesov", "pompo", "shadowball", "smarty", "sparkys",
      "tlama-games", "tolarie", "vesely-drak", "vortexstore",
    ].map((shop) => access(new URL(`shop-icons/${shop}.png`, output))),
    access(new URL("_headers", output)),
    access(new URL("404.html", output)),
  ]);
});

test("custom cursor is lightweight and limited to precise pointing devices", async () => {
  const [globalCss, cursorSvg, activeCursorSvg] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readOutput("tcg-cursor.svg"),
    readOutput("tcg-cursor-active.svg"),
  ]);

  assert.match(globalCss, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(globalCss, /cursor:\s*url\("\/tcg-cursor\.svg"\) 3 3, auto/);
  assert.match(globalCss, /button:not\(:disabled\)[\s\S]*cursor:\s*url\("\/tcg-cursor-active\.svg"\) 3 3, auto !important/);
  assert.match(globalCss, /\[contenteditable="true"\][\s\S]*cursor:\s*text/);
  assert.match(cursorSvg, /width="28" height="28"/i);
  assert.match(cursorSvg, /stroke="#e6b84a"/i);
  assert.match(activeCursorSvg, /width="28" height="28"/i);
  assert.match(activeCursorSvg, /linearGradient id="active-gold"/i);
  assert.match(activeCursorSvg, /stroke="url\(#active-gold\)"/i);
  assert.doesNotMatch(activeCursorSvg, /<circle/i);
  assert.ok(Buffer.byteLength(cursorSvg) < 2_000);
  assert.ok(Buffer.byteLength(activeCursorSvg) < 2_000);
});

test("slow data views share the lightweight branded card loader", async () => {
  const [loader, globalCss, watching, drops, portfolio] = await Promise.all([
    readFile(new URL("../app/BrandedLoader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/sledovani/SledovaniClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/zlevneni/PriceDropsClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/portfolio/PortfolioClient.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(loader, /delayMs = 320/);
  assert.match(loader, /longDelayMs = 6_500/);
  assert.match(loader, /aria-live="polite"/);
  assert.match(loader, /aria-hidden=\{!visible\}/);
  assert.match(globalCss, /@keyframes tcg-card-shuffle-front/);
  assert.match(globalCss, /@keyframes tcg-card-shuffle-back/);
  assert.match(globalCss, /animation-play-state:\s*paused/);
  assert.match(watching, /<BrandedLoader/);
  assert.match(drops, /<BrandedLoader/);
  assert.match(portfolio, /<BrandedLoader/);
  assert.doesNotMatch(watching, /watching-loader/);
  assert.doesNotMatch(drops, /drops-loader/);
});

test("portfolio uses the dedicated investment database", async () => {
  const [portfolio, portfolioDataText, publicPortfolioDataText, portfolioSource, portfolioCss, centralProductsSource, catalog, productDetailSource, privacy, authMenuSource] = await Promise.all([
    readOutput("portfolio/index.html"),
    readFile(new URL("../app/portfolio/portfolio-data.json", import.meta.url), "utf8"),
    readOutput("portfolio-products.json"),
    readFile(new URL("../app/portfolio/PortfolioClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/portfolio/portfolio.css", import.meta.url), "utf8"),
    readFile(new URL("../app/portfolio/central-products.ts", import.meta.url), "utf8"),
    readOutput("katalog/index.html"),
    readFile(new URL("../app/produkt/[slug]/ProductPageClient.tsx", import.meta.url), "utf8"),
    readOutput("soukromi-a-cookies/index.html"),
    readFile(new URL("../app/AuthMenu.tsx", import.meta.url), "utf8"),
  ]);
  const portfolioData = JSON.parse(portfolioDataText);
  const publicPortfolioData = JSON.parse(publicPortfolioDataText);

  assert.match(portfolio, /Hodnota tvé sbírky/);
  assert.match(portfolio, /sealed produktů v portfolio databázi/);
  assert.match(portfolioSource, /Přihlásit přes Discord/);
  assert.match(portfolioSource, /Přihlásit přes Google/);
  assert.match(portfolioSource, /Hesla od Discordu ani Googlu/);
  assert.doesNotMatch(portfolio, /178 produktů připravených k přidání z katalogu/);
  assert.ok(portfolioData.productCount > 1500);
  assert.equal(portfolioData.products.length, portfolioData.productCount);
  assert.equal(publicPortfolioData.products.length, portfolioData.productCount);
  assert.ok(Buffer.byteLength(portfolio, "utf8") < 150_000, "portfolio HTML must not embed the full product database");
  assert.ok(portfolioData.products.every((product) => product.id && product.name && product.type));
  assert.ok(portfolioData.products.some((product) => product.marketPrice > 0));
  for (const productId of ["cardmarket:728730", "cardmarket:719700"]) {
    const product = portfolioData.products.find((item) => item.id === productId);
    assert.ok(product, `portfolio should contain ${productId}`);
    assert.ok(product.marketPrice > 0, `${productId} should have a CZK market price`);
    assert.match(
      product.image,
      /^\/catalog-products\//,
      `${productId} should reuse a prepared local catalog image`,
    );
  }
  assert.match(portfolioSource, /useState<LoadState>\("loading"\)/);
  assert.match(portfolioSource, /credentials: "include"/);
  assert.match(portfolioSource, /loadPortfolioProducts/);
  assert.match(centralProductsSource, /api\/portfolio\/products\?limit=500/);
  assert.match(centralProductsSource, /portfolio-products\.json/);
  assert.match(centralProductsSource, /price\?\.price_czk \?\? null/);
  assert.match(centralProductsSource, /total < fallback\.length/);
  assert.match(centralProductsSource, /source: "fallback"/);
  assert.match(portfolioSource, /Zobrazené nuly by nebyly spolehlivé/);
  assert.match(portfolioSource, /portfolioLoadState === "error"/);
  assert.match(portfolioSource, /method: "PATCH"/);
  assert.match(portfolioSource, /Upravit produkt/);
  assert.match(portfolioSource, /Vývoj hodnoty sbírky/);
  assert.match(portfolioSource, /Vývoj ukázkové sbírky/);
  assert.match(portfolioSource, /setDemoPeriod/);
  assert.match(portfolioSource, /demo\?: boolean/);
  assert.match(portfolioSource, /productDescriptor/);
  assert.match(portfolioSource, /Ilustrační demo · skutečné portfolio používá denní cenové záznamy/);
  assert.match(portfolioSource, /api\/portfolio\/history/);
  assert.match(portfolioSource, /linearGradient id=\{areaGradientId\}/);
  assert.match(portfolioSource, /index === activeTarget\.index \? 4 : 1\.8/);
  assert.match(portfolioCss, /\.portfolio-chart-market\s*\{[^}]*stroke-width:\s*2\.25/);
  assert.doesNotMatch(portfolioCss, /\.portfolio-chart-market\s*\{[^}]*drop-shadow/);
  assert.match(
    portfolioCss,
    /@media \(max-width: 560px\)[\s\S]*?\.portfolio-item \.portfolio-product-image img\s*\{[^}]*max-width:\s*68px;[^}]*max-height:\s*76px;/,
  );
  assert.match(portfolioCss, /\.portfolio-item-copy\s*\{[^}]*min-width:\s*0;/);
  assert.match(portfolioCss, /\.portfolio-item-copy h3\s*\{[^}]*overflow-wrap:\s*anywhere;/);
  assert.match(portfolioSource, /value: 365, label: "1 rok"/);
  assert.match(portfolioSource, /value: "max", label: "Maximum"/);
  assert.match(portfolioSource, /Trash2/);
  assert.match(portfolioSource, /setBuyPriceInput\(event\.target\.value\)/);
  assert.doesNotMatch(portfolioSource, /setBuyPrice\(Number\(event\.target\.value\)\)/);
  assert.match(authMenuSource, /useState<SessionUser \| null \| undefined>/);
  assert.match(authMenuSource, /sessionStorage\.getItem\(SESSION_USER_CACHE_KEY\)/);
  assert.match(authMenuSource, /isLoading \? " is-loading"/);
  assert.match(authMenuSource, /disabled=\{isLoading\}/);
  assert.match(catalog, /href="\/portfolio\/"/);
  assert.match(productDetailSource, /Přidat do portfolia/);
  assert.match(productDetailSource, /\/porovnani\/\?add=\$\{encodeURIComponent\(product\.id\)\}/);
  assert.doesNotMatch(productDetailSource, /addName|addImage|addPrice|tcg_comparison_catalog_product/);
  assert.match(privacy, /Discord ID/);
  assert.match(privacy, /Přihlášení přes Google/);
  assert.match(privacy, /technicky nezbytnou zabezpečenou cookie/);
});

test("product comparison uses current market value and exact quantities", async () => {
  const [html, source] = await Promise.all([
    readOutput("porovnani/index.html"),
    readFile(new URL("../app/porovnani/CompareClient.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(html, /Srovnej hodnotu/);
  assert.match(source, /Můj výběr/);
  assert.match(source, /Srovnávaný výběr/);
  assert.match(source, /loadPortfolioProducts/);
  assert.match(source, /marketPrice/);
  assert.match(source, /Doporučené dorovnání/);
  assert.match(source, /sessionStorage/);
  assert.match(source, /Centrální ceny jsou dočasně nedostupné/);
  assert.match(source, /productLoadStatus\?\.source === "fallback"/);
  assert.doesNotMatch(source, /buyPrice|nákupní cenu|pořizovací cenu/i);

  assert.equal(selectionTotal([
    { price: 1_200, quantity: 2 },
    { price: 450, quantity: 3 },
    { price: null, quantity: 4 },
  ]), 3_750);

  assert.deepEqual(comparisonSummary(
    [{ price: 1_000, quantity: 2 }],
    [{ price: 1_900, quantity: 1 }],
  ), {
    mineTotal: 2_000,
    comparedTotal: 1_900,
    difference: 100,
    differencePercent: 5,
    balanced: false,
  });
  assert.equal(
    comparisonSummary([{ price: 1_000, quantity: 1 }], [{ price: 980, quantity: 1 }]).balanced,
    true,
  );
  assert.match(source, /const query = new URLSearchParams\(window\.location\.search\)/);
  assert.match(source, /const requestedProduct = query\.get\("add"\)/);
  assert.doesNotMatch(source, /query\.get\("addName"\)|query\.get\("addPrice"\)/);
  assert.match(source, /api\/catalog\/products\/\$\{encodeURIComponent\(requestedProduct\)\}/);
  assert.match(source, /loadedProducts\.some\(\(product\) => product\.id === requestedProduct\)/);
  assert.doesNotMatch(source, /tcg_comparison_catalog_product/);
  assert.match(source, /cleanUrl\.searchParams\.delete\("add"\)/);
});

test("shop links allow only HTTPS URLs on supported domains", () => {
  assert.equal(safeShopUrl("https://www.alza.cz/hracky/produkt"), "https://www.alza.cz/hracky/produkt");
  assert.equal(safeShopUrl("https://vortexstore.eu/products/test"), "https://vortexstore.eu/products/test");
  assert.equal(safeShopUrl("http://www.alza.cz/hracky/produkt"), null);
  assert.equal(safeShopUrl("https://alza.cz.attacker.example/produkt"), null);
  assert.equal(safeShopUrl("javascript:alert(1)"), null);
});

test("production sitemap is served without a trailing-slash redirect", async () => {
  const response = handleSitemap(new Request("https://tcgceny.cz/sitemap.xml"));
  assert.ok(response);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type") ?? "", /^application\/xml/);
  assert.match(await response.text(), /<loc>https:\/\/tcgceny\.cz\/katalog\/<\/loc>/);
  const body = await handleSitemap(new Request("https://tcgceny.cz/sitemap.xml"))?.text();
  assert.match(body ?? "", /<loc>https:\/\/tcgceny\.cz\/porovnani\/<\/loc>/);

  const head = handleSitemap(new Request("https://tcgceny.cz/sitemap.xml", { method: "HEAD" }));
  assert.ok(head);
  assert.equal(await head.text(), "");

  const post = handleSitemap(new Request("https://tcgceny.cz/sitemap.xml", { method: "POST" }));
  assert.equal(post?.status, 405);
  assert.equal(post?.headers.get("Allow"), "GET, HEAD");
  assert.equal(handleSitemap(new Request("https://tcgceny.cz/robots.txt")), null);
});

test("portfolio API keeps authentication and ownership checks server-side", async () => {
  const [api, migration, exampleVars] = await Promise.all([
    readFile(new URL("../worker/portfolio-api.ts", import.meta.url), "utf8"),
    readFile(new URL("../migrations/0001_portfolio.sql", import.meta.url), "utf8"),
    readFile(new URL("../.dev.vars.example", import.meta.url), "utf8"),
  ]);

  assert.match(api, /scope: "identify"/);
  assert.match(api, /scope: "openid profile email"/);
  assert.match(api, /protocol === "https:" \? "; Secure" : ""/);
  assert.match(api, /HttpOnly\$\{secure\}; SameSite=Lax/);
  assert.match(api, /code_challenge_method: "S256"/);
  assert.match(api, /WHERE discord_user_id = \?/);
  assert.match(api, /UPDATE portfolio_items/);
  assert.match(api, /WHERE id = \? AND discord_user_id = \?/);
  assert.match(api, /validMutationOrigin/);
  assert.match(api, /hasDiscordOAuthConfig/);
  assert.match(api, /discord_not_configured/);
  assert.match(api, /google_not_configured/);
  assert.match(api, /google:\$\{profile\.sub\}/);
  assert.match(api, /linkFrom\?: SessionUser/);
  assert.match(api, /\/api\/v1\/account\/identities/);
  assert.match(api, /access_token: accessToken/);
  assert.match(api, /sameIdentity\(current, oauth\.linkFrom\)/);
  assert.match(migration, /FOREIGN KEY \(discord_user_id\)/);
  assert.match(exampleVars, /SESSION_SECRET=/);
  assert.match(exampleVars, /GOOGLE_CLIENT_ID=/);
  assert.doesNotMatch(api, /scope: "email"/);
});

test("catalog prefers the central API and keeps the build snapshot as fallback", async () => {
  const [client, proxy, exampleVars] = await Promise.all([
    readFile(new URL("../app/katalog/CatalogClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../worker/catalog-api.ts", import.meta.url), "utf8"),
    readFile(new URL("../.dev.vars.example", import.meta.url), "utf8"),
  ]);

  assert.match(client, /limit: String\(PAGE_SIZE\)/);
  assert.match(client, /offset: String\(\(page - 1\) \* PAGE_SIZE\)/);
  assert.match(client, /window\.setTimeout\(\(\) => setDebouncedQuery\(query\.trim\(\)\), 300\)/);
  assert.match(client, /window\.history\.replaceState/);
  assert.doesNotMatch(client, /for \(let offset = 0; offset < total/);
  assert.match(client, /embedded build snapshot is the deliberate availability fallback/);
  assert.match(proxy, /REQUEST_TIMEOUT_MS = 12_000/);
  assert.match(client, /productPath\(product\)/);
  assert.doesNotMatch(client, /Rychlý náhled|catalog-card-preview|api\/catalog\/products\/\$\{encodeURIComponent\(product\.id\)\}/);
  assert.match(proxy, /CENTRAL_API_BASE_URL/);
  assert.match(proxy, /X-TCG-Proxy-Token/);
  assert.match(proxy, /X-TCG-Client-Key/);
  assert.doesNotMatch(proxy, /Authorization|Cookie/);
  assert.match(exampleVars, /CENTRAL_API_BASE_URL=http:\/\/127\.0\.0\.1:8000/);
});

test("catalog proxy is read-only and forwards no user credentials", async () => {
  assert.equal(
    await handleCatalogApi(new Request("https://tcgceny.cz/katalog/"), {}),
    null,
  );

  const notConfigured = await handleCatalogApi(
    new Request("https://tcgceny.cz/api/catalog/products"),
    {},
  );
  assert.equal(notConfigured.status, 503);
  assert.deepEqual(await notConfigured.json(), { error: "central_catalog_not_configured" });

  const rejected = await handleCatalogApi(
    new Request("https://tcgceny.cz/api/catalog/products", { method: "POST" }),
    { CENTRAL_API_BASE_URL: "https://backend.example" },
  );
  assert.equal(rejected.status, 405);

  const originalFetch = globalThis.fetch;
  let forwardedUrl = "";
  let forwardedInit;
  globalThis.fetch = async (input, init) => {
    forwardedUrl = String(input);
    forwardedInit = init;
    return Response.json({ items: [], total: 0, limit: 100, offset: 0 });
  };
  try {
    const response = await handleCatalogApi(
      new Request("https://tcgceny.cz/api/catalog/products?limit=100&offset=0", {
        headers: {
          Authorization: "Bearer must-not-leak",
          "CF-Connecting-IP": "203.0.113.10",
          Cookie: "session=must-not-leak",
        },
      }),
      {
        CENTRAL_API_BASE_URL: "https://backend.example",
        CENTRAL_API_SERVICE_TOKEN: "s".repeat(48),
      },
    );
    assert.equal(response.status, 200);
    assert.equal(
      forwardedUrl,
      "https://backend.example/api/v1/catalog/products?limit=100&offset=0",
    );
    assert.equal(forwardedInit.method, "GET");
    assert.equal(forwardedInit.headers.get("Accept"), "application/json");
    assert.equal(forwardedInit.headers.get("Authorization"), null);
    assert.equal(forwardedInit.headers.get("Cookie"), null);
    assert.equal(forwardedInit.headers.get("X-TCG-Proxy-Token"), "s".repeat(48));
    assert.match(forwardedInit.headers.get("X-TCG-Client-Key"), /^[a-f0-9]{64}$/);
    assert.match(forwardedInit.headers.get("X-Request-ID"), /^[a-f0-9-]{36}$/);
    assert.equal(response.headers.get("X-TCG-Catalog-Source"), "central-api");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("central portfolio proxy uses only its service identity", async () => {
  const originalFetch = globalThis.fetch;
  let forwardedUrl = "";
  let forwardedInit;
  globalThis.fetch = async (input, init) => {
    forwardedUrl = String(input);
    forwardedInit = init;
    return Response.json({
      items: [
        {
          id: "central-item-1",
          product: {
            id: "cardmarket:728730",
            name: "Test product",
            image_url: "/catalog-products/test.png",
          },
          quantity: 2,
          buy_price_czk: 1000,
          buy_date: "2026-07-30",
          note: "sealed",
          latest_market_price: {
            price_czk: 1500,
            priced_on: "2026-08-01",
            source: "cardmarket",
          },
        },
      ],
      summary: { invested_czk: 2000, market_value_czk: 3000 },
    });
  };
  try {
    const response = await centralPortfolioRequest(
      new Request("https://tcgceny.cz/api/portfolio", {
        headers: {
          Authorization: "Bearer browser-token-must-not-leak",
          Cookie: "browser-cookie-must-not-leak",
        },
      }),
      {
        sub: "google:subject-1",
        username: "Collector",
        avatar: null,
        provider: "google",
        exp: 9999999999,
      },
      {
        CENTRAL_API_BASE_URL: "https://backend.example",
        CENTRAL_API_SERVICE_TOKEN: "s".repeat(48),
      },
    );

    assert.equal(response.status, 200);
    assert.equal(forwardedUrl, "https://backend.example/api/v1/portfolio/items");
    assert.equal(forwardedInit.method, "GET");
    assert.equal(forwardedInit.headers.get("Authorization"), `Bearer ${"s".repeat(48)}`);
    assert.equal(forwardedInit.headers.get("X-TCG-Identity-Provider"), "google");
    assert.equal(forwardedInit.headers.get("X-TCG-Identity-Subject"), "subject-1");
    assert.equal(forwardedInit.headers.get("Cookie"), null);
    const payload = await response.json();
    assert.equal(payload.items[0].id, "central-item-1");
    assert.equal(payload.items[0].buyPrice, 1000);
    assert.equal(payload.items[0].product.marketPrice, 1500);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("market changes proxy preserves Discord event IDs, filters and pagination", async () => {
  const originalFetch = globalThis.fetch;
  let target;
  let forwarded;
  const payload = { items: [{ id: "market-alert:v1:test", event_type: "restock", new_price_czk: 1799 }], total: 25, limit: 24, offset: 24 };
  globalThis.fetch = async (url, init) => {
    target = String(url);
    forwarded = init;
    return Response.json(payload);
  };
  try {
    const response = await handleCatalogApi(new Request(
      "https://tcgceny.cz/api/catalog/changes?days=7&event_type=restock&limit=24&offset=24",
      { headers: { Cookie: "must-not-forward", Authorization: "must-not-forward" } },
    ), { CENTRAL_API_BASE_URL: "https://backend.example" });
    assert.equal(response.status, 200);
    assert.equal(target, "https://backend.example/api/v1/catalog/changes?days=7&event_type=restock&limit=24&offset=24");
    assert.equal(forwarded.method, "GET");
    assert.equal(forwarded.headers.get("Cookie"), null);
    assert.equal(forwarded.headers.get("Authorization"), null);
    assert.deepEqual(await response.json(), payload);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("market feed includes restocks, server filters, paging and safe read tracking", async () => {
  const [html, source, css, mobileNav] = await Promise.all([
    readOutput("zlevneni/index.html"),
    readFile(new URL("../app/zlevneni/PriceDropsClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/zlevneni/zlevneni.css", import.meta.url), "utf8"),
    readFile(new URL("../app/MobileNav.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(html, /<h1>Slevy a<br\s*\/?><strong>naskladnění\.<\/strong><\/h1>/);
  assert.match(html, /<title>Slevy a naskladnění Pokémon TCG/);
  assert.match(mobileNav, /label: "Slevy a naskladnění"/);
  assert.match(source, /api\/catalog\/changes\?days=/);
  assert.match(source, /event_type=\$\{kind\}/);
  assert.match(source, /offset=\$\{offset\}/);
  assert.match(source, /value: "restock", label: "Nově skladem"/);
  assert.match(source, /controller\.abort\(\)/);
  assert.match(source, /kind === "all" && sort === "newest" && offset === 0/);
  assert.match(source, /Cena a dostupnost odpovídají okamžiku oznámení/);
  assert.match(source, /aria-label="Stránkování změn"/);
  assert.match(source, /Potvrzené zlevnění/);
  assert.match(source, /old_price_czk/);
  assert.match(source, /new_price_czk/);
  assert.match(source, /Největší pokles/);
  assert.match(source, /Otevřít nabídku/);
  assert.match(source, /embeddedImages/);
  assert.match(source, /pokemonproductimages\.pokedata\.io/);
  assert.match(source, /rel="noopener noreferrer"/);
  assert.match(css, /grid-template-columns:\s*148px minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(mobileNav, /\/zlevneni\//);
});

test("catalog report proxy validates origin and forwards only server-derived identity", async () => {
  const sessionSecret = "catalog-report-session-secret-1234567890";
  const env = {
    CENTRAL_API_BASE_URL: "https://backend.example",
    CENTRAL_API_SERVICE_TOKEN: "s".repeat(48),
    SESSION_SECRET: sessionSecret,
  };
  const rejected = await handleCatalogReportApi(
    new Request("https://tcgceny.cz/api/catalog/reports", {
      method: "POST",
      headers: { Origin: "https://attacker.example", "CF-Connecting-IP": "203.0.113.5" },
      body: JSON.stringify({ product_id: "test", issue_type: "price" }),
    }),
    env,
  );
  assert.equal(rejected.status, 403);

  const anonymous = await handleCatalogReportApi(
    new Request("https://tcgceny.cz/api/catalog/reports", {
      method: "POST",
      headers: { Origin: "https://tcgceny.cz", "CF-Connecting-IP": "203.0.113.5" },
      body: JSON.stringify({ product_id: "test", issue_type: "price" }),
    }),
    env,
  );
  assert.equal(anonymous.status, 401);

  const cookie = await webSessionCookie({
    sub: "google:reporter-1",
    username: "Catalog Reporter",
    avatar: null,
    provider: "google",
    exp: 9999999999,
  }, sessionSecret);

  const originalFetch = globalThis.fetch;
  let forwardedUrl = "";
  let forwardedInit;
  globalThis.fetch = async (input, init) => {
    forwardedUrl = String(input);
    forwardedInit = init;
    return Response.json({ id: "report-1", created: true, occurrence_count: 1, status: "new" }, { status: 201 });
  };
  try {
    const response = await handleCatalogReportApi(
      new Request("https://tcgceny.cz/api/catalog/reports", {
        method: "POST",
        headers: {
          Origin: "https://tcgceny.cz",
          Referer: "https://tcgceny.cz/produkt/test-product-123/?ignored=1",
          "Content-Type": "application/json",
          "CF-Connecting-IP": "203.0.113.5",
          Cookie: cookie,
        },
        body: JSON.stringify({
          product_id: "test-product",
          issue_type: "price",
          note: "Cena je jiná",
          shop: "Test Shop",
          offer_url: "https://shop.example/product",
          displayed_price_czk: 899,
          displayed_availability: "online",
          page_path: "/produkt/podvrzeno/",
          injected: "must-not-forward",
        }),
      }),
      env,
    );
    assert.equal(response.status, 201);
    assert.equal(forwardedUrl, "https://backend.example/api/v1/catalog/reports");
    assert.equal(forwardedInit.method, "POST");
    assert.equal(forwardedInit.headers.get("X-TCG-Proxy-Token"), "s".repeat(48));
    assert.match(forwardedInit.headers.get("X-TCG-Client-Key"), /^[a-f0-9]{64}$/);
    assert.equal(forwardedInit.headers.get("Authorization"), `Bearer ${"s".repeat(48)}`);
    assert.equal(forwardedInit.headers.get("X-TCG-Identity-Provider"), "google");
    assert.equal(forwardedInit.headers.get("X-TCG-Identity-Subject"), "reporter-1");
    const forwardedBody = JSON.parse(forwardedInit.body);
    assert.equal(forwardedBody.page_path, "/produkt/test-product-123/?ignored=1");
    assert.equal(forwardedBody.injected, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("public portfolio product proxy prefers central data without browser credentials", async () => {
  const originalFetch = globalThis.fetch;
  let forwardedUrl = "";
  let forwardedInit;
  globalThis.fetch = async (input, init) => {
    forwardedUrl = String(input);
    forwardedInit = init;
    return Response.json({ items: [], total: 0, limit: 500, offset: 0 });
  };
  try {
    const response = await centralPortfolioProductsRequest(
      new Request("https://tcgceny.cz/api/portfolio/products?limit=500&offset=0", {
        headers: {
          Authorization: "Bearer browser-token-must-not-leak",
          Cookie: "browser-cookie-must-not-leak",
          "CF-Connecting-IP": "203.0.113.11",
        },
      }),
      {
        CENTRAL_API_BASE_URL: "https://backend.example",
        CENTRAL_API_SERVICE_TOKEN: "s".repeat(48),
      },
    );

    assert.equal(response.status, 200);
    assert.equal(
      forwardedUrl,
      "https://backend.example/api/v1/portfolio/products?limit=500&offset=0",
    );
    assert.equal(forwardedInit.headers.get("Authorization"), null);
    assert.equal(forwardedInit.headers.get("Cookie"), null);
    assert.equal(forwardedInit.headers.get("X-TCG-Proxy-Token"), "s".repeat(48));
    assert.match(forwardedInit.headers.get("X-TCG-Client-Key"), /^[a-f0-9]{64}$/);
    assert.equal(response.headers.get("X-TCG-Portfolio-Product-Source"), "central-api");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("central portfolio history proxy preserves the selected period", async () => {
  const originalFetch = globalThis.fetch;
  let forwardedUrl = "";
  globalThis.fetch = async (input) => {
    forwardedUrl = String(input);
    return Response.json({
      days: 30,
      points: [
        {
          valued_on: "2026-08-01",
          invested_czk: 9990,
          market_value_czk: 10097,
          profit_czk: 107,
        },
      ],
      investment_points: [
        {
          invested_on: "2026-07-22",
          invested_czk: 2790,
        },
      ],
      first_valued_on: "2026-08-01",
      latest_valued_on: "2026-08-01",
    });
  };
  try {
    const response = await centralPortfolioRequest(
      new Request("https://tcgceny.cz/api/portfolio/history?days=30"),
      {
        sub: "discord:123456789",
        username: "Collector",
        avatar: null,
        provider: "discord",
        exp: 9999999999,
      },
      {
        CENTRAL_API_BASE_URL: "https://backend.example",
        CENTRAL_API_SERVICE_TOKEN: "s".repeat(48),
      },
      undefined,
      "history",
    );

    assert.equal(response.status, 200);
    assert.equal(forwardedUrl, "https://backend.example/api/v1/portfolio/history?days=30");
    const payload = await response.json();
    assert.deepEqual(payload.points[0], {
      date: "2026-08-01",
      invested: 9990,
      marketValue: 10097,
      profit: 107,
    });
    assert.deepEqual(payload.investmentPoints[0], {
      date: "2026-07-22",
      invested: 2790,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("central portfolio mutations keep the origin gate", async () => {
  const response = await centralPortfolioRequest(
    new Request("https://tcgceny.cz/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),
    {
      sub: "123456789",
      username: "Collector",
      avatar: null,
      provider: "discord",
      exp: 9999999999,
    },
    {
      CENTRAL_API_BASE_URL: "https://backend.example",
      CENTRAL_API_SERVICE_TOKEN: "s".repeat(48),
    },
  );

  assert.equal(response.status, 403);
});

test("central readonly mode rejects writes before reaching either database", async () => {
  const secret = "session-secret-for-tests";
  const cookie = await webSessionCookie(
    {
      sub: "123456789",
      username: "Collector",
      avatar: null,
      provider: "discord",
      exp: Math.floor(Date.now() / 1000) + 60,
    },
    secret,
  );
  const response = await handlePortfolioApi(
    new Request("https://tcgceny.cz/api/portfolio", {
      method: "POST",
      headers: {
        Cookie: cookie,
        Origin: "https://tcgceny.cz",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }),
    {
      SESSION_SECRET: secret,
      PORTFOLIO_DATA_SOURCE: "central-readonly",
    },
  );

  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /pouze pro čtení/);
});

test("catalog contains the complete public product snapshot", async () => {
  const [html, dataText] = await Promise.all([
    readOutput("katalog/index.html"),
    readFile(new URL("../app/katalog/catalog-data.json", import.meta.url), "utf8"),
  ]);
  const data = JSON.parse(dataText);

  assert.match(html, /Najdi produkt/);
  assert.match(html, /Porovnej český trh/);
  assert.equal(data.productCount, data.products.length);
  assert.ok(data.productCount >= 178, "catalog must not lose previously published products");
  assert.ok(data.products.every((product) => product.id && product.name && product.type));
  assert.ok(
    data.products.filter((product) => product.era && product.set).length >= 178,
    "catalog must retain the previously classified product set",
  );
  assert.ok(data.products.every((product) => Array.isArray(product.offers)));
  assert.ok(data.products.every((product) => typeof product.verified === "boolean"));
  assert.ok(data.products.every((product) => product.releaseDate === null || /^\d{4}-\d{2}-\d{2}$/.test(product.releaseDate)));
  assert.ok(data.products.some((product) => product.condition === "sealed"));
  assert.ok(data.products.some((product) => product.condition === "opening"));
  assert.ok(
    data.products.every((product) => ["sealed", "opening"].includes(product.condition)),
    "every catalog product must have a supported condition",
  );
  assert.ok(
    data.products.filter((product) => product.image.startsWith("/catalog-products/")).length >= 178,
    "catalog must retain every previously prepared local image",
  );
  assert.ok(
    data.products.every(
      (product) =>
        product.image.startsWith("/catalog-products/") || product.image.startsWith("https://"),
    ),
    "every catalog product must use a local or secure external image",
  );
  const journeyTogether = data.products.find(
    (product) => product.name === "Journey Together Booster Box",
  );
  assert.ok(journeyTogether.offers.some((offer) => offer.shop === "Vortexstore"));
  assert.ok(journeyTogether.offers.every((offer) => offer.shop !== "Pikastore"));

  const sealedProducts = data.products.filter((product) => product.condition === "sealed");
  assert.deepEqual(
    [...new Set(sealedProducts.slice(0, 3).map((product) => product.set))],
    ["Pitch Black"],
    "the newest sealed Pitch Black products should lead the catalog snapshot",
  );
  assert.deepEqual(
    new Set(sealedProducts.slice(0, 3).map((product) => product.type)),
    new Set(["ETB", "Booster Bundle", "Booster Box"]),
  );

  const destinedRivalsHalf = data.products.find(
    (product) => product.name === "Destined Rivals Half Booster Box",
  );
  assert.ok(destinedRivalsHalf);
  assert.ok(destinedRivalsHalf.offers.every((offer) => offer.shop !== "Vortexstore"));
});

test("homepage contains production metadata and core content", async () => {
  const html = await readOutput("index.html");
  const cardCompanionSource = await readFile(
    new URL("../app/CardCompanion.tsx", import.meta.url),
    "utf8",
  );

  assert.match(html, /<html lang="cs"(?:\s[^>]*)?>/i);
  assert.match(html, /TCG Ceny \| Ceny, skladovost a alerty Pokémon TCG/i);
  assert.match(html, /Pokémon TCG na jednom místě/i);
  assert.doesNotMatch(html, /Český Pokémon TCG market monitor/i);
  assert.match(html, /https:\/\/tcgceny\.cz/);
  assert.match(html, /brand-mark\.svg/);
  assert.match(html, /favicon\.png/);
  assert.match(html, /tcg-ceny-social-1200x630\.png/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /Neplať víc/);
  assert.match(html, /Nezmeškej naskladnění/);
  assert.match(html, /Přidat se na Discord/);
  assert.match(html, /class="discord-button"/);
  assert.match(html, /Všechno pro chytřejší nákup/);
  assert.match(html, /Najdi produkt\. Porovnej\. Nastav sledování/);
  assert.match(html, /Začni hlídat ceny zdarma/);
  assert.match(html, /Historie cen/);
  assert.match(html, /Portfolio v jednom přehledu/i);
  assert.match(html, /card-companion/);
  assert.match(html, /Spustit průvodce/);
  assert.match(html, /6 krátkých zastávek · 45 s/);
  assert.match(html, /Spustit krátkého průvodce webem TCG Ceny/);
  assert.match(html, /shop-marquee-track/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /Otevřít e-shop Knihy Dobrovský v nové kartě/);
  assert.match(html, /Otevřít e-shop Pokešov v nové kartě/);
  assert.match(html, /Otevřít e-shop Vortexstore v nové kartě/);
  assert.match(html, /href="https:\/\/www\.alza\.cz\/"/);
  assert.match(html, /href="https:\/\/www\.bulbazard\.cz\/"/);
  assert.match(html, /href="https:\/\/www\.pokesov\.cz\/"/);
  assert.match(html, /href="https:\/\/www\.tlamagames\.com\/"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /tabindex="-1"/i);
  assert.doesNotMatch(html, />a další</);
  assert.doesNotMatch(html, /Tvůj TCG průvodce/);
  assert.match(html, /https:\/\/discord\.gg\/pRC8GKAKxG/);
  assert.match(html, /podpora@tcgceny\.cz/);
  assert.doesNotMatch(
    html,
    /codex-preview|chatgpt|openai|Your site is taking shape|react-loading-skeleton/i,
  );

  const globalCss = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(globalCss, /@keyframes owl-companion-arrive/);
  assert.match(globalCss, /@keyframes owl-companion-attention/);
  assert.match(globalCss, /@keyframes owl-companion-guide-start/);
  assert.match(globalCss, /@keyframes owl-companion-success/);
  assert.match(globalCss, /@keyframes owl-companion-error/);
  assert.match(globalCss, /@keyframes owl-companion-loading-scan/);
  assert.match(globalCss, /@keyframes owl-companion-signal/);
  assert.match(globalCss, /@keyframes owl-companion-card-spark/);
  assert.match(globalCss, /@keyframes companion-invite-sweep/);
  assert.doesNotMatch(globalCss, /@keyframes owl-companion-flight/);
  assert.match(globalCss, /\.owl-companion-flight\s*\{[^}]*animation:\s*owl-companion-attention 6\.2s/s);
  assert.doesNotMatch(globalCss, /@keyframes owl-companion-attention\s*\{[^}]*scale\(/s);
  assert.doesNotMatch(globalCss, /owl-companion-(?:eye|iris|eyelid|blink)/);
  assert.match(globalCss, /animation:\s*companion-invite 1100ms[^;]*1 both;/);
  assert.doesNotMatch(globalCss, /companion-shuffle/);
  assert.match(globalCss, /\.card-companion-owl:hover \.owl-companion-image/);
  assert.doesNotMatch(globalCss, /--owl-look-[xy]/);
  assert.doesNotMatch(cardCompanionSource, /requestAnimationFrame|onPointerMove/);
  assert.match(cardCompanionSource, /data-owl-state=\{owlState\}/);
  assert.match(cardCompanionSource, /tcg-owl-state/);
  assert.doesNotMatch(
    globalCss,
    /\.card-companion-owl:hover \.owl-companion-flight\s*\{[^}]*animation-play-state:\s*paused;/s,
  );
  assert.match(
    globalCss,
    /\.card-companion:hover \.card-companion-copy\s*\{[^}]*transform:\s*translateX\(-4px\);/s,
  );
  assert.match(html, /tcg-ceny-owl-mascot-v1\.webp/);
  assert.match(globalCss, /\.site-tour-panel/);
  assert.match(globalCss, /\.site-tour\s*\{[^}]*pointer-events:\s*none;/s);
  assert.match(globalCss, /\.site-tour-panel\s*\{[^}]*pointer-events:\s*auto;/s);
  assert.match(globalCss, /@keyframes tour-panel-in/);
  assert.match(globalCss, /@keyframes shop-marquee/);
  assert.match(globalCss, /\.shop-marquee:hover \.shop-marquee-track/);
  assert.match(globalCss, /\.shop-marquee:focus-within \.shop-marquee-track/);
  assert.match(globalCss, /\.shop-marquee\s*\{[^}]*padding-block:\s*8px;[^}]*margin-block:\s*-8px;/s);
  assert.doesNotMatch(html, /shop-marquee-toggle/);
  assert.doesNotMatch(globalCss, /\.shop-marquee-toggle/);
  const mobileCss = globalCss.slice(
    globalCss.indexOf("@media (max-width: 980px)"),
    globalCss.indexOf("@media (max-width: 640px)"),
  );
  assert.match(mobileCss, /\.shop-marquee-track\s*\{[^}]*animation:\s*shop-marquee 52s linear infinite;/s);
  assert.doesNotMatch(mobileCss, /\.shop-tags\[aria-hidden="true"\]\s*\{[^}]*display:\s*none;/s);
  assert.match(globalCss, /\.skip-link:focus/);
  assert.match(globalCss, /\.shop-link:focus-visible/);
  assert.match(globalCss, /\.shop-tags\[aria-hidden="true"\]/);
  assert.match(globalCss, /@media \(prefers-reduced-motion: reduce\)/);

  const [layoutSource, tourSource] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/SiteTour.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(layoutSource, /Přeskočit na hlavní obsah/);
  assert.match(layoutSource, /id="main-content"/);
  assert.match(tourSource, /event\.key === "Escape"/);
  assert.match(tourSource, /previousFocusRef\.current\?\.focus/);
});

test("tour uses six distinct local owl illustrations without the legacy card mascot", async () => {
  const source = await readFile(new URL("../app/SiteTour.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const poses = ["welcome", "search", "price-drop", "alert", "collection", "compare"];
  assert.deepEqual([...source.matchAll(/owl: "([a-z-]+)"/g)].map((match) => match[1]), poses);
  assert.match(source, /data-tour-owl=\{current\.owl\}/);
  assert.match(source, /src=\{`\/brand\/tour\/owl-\$\{current\.owl\}-\$\{owlVersion\}\.webp`\}/);
  assert.match(source, /const SEALED_OWL_POSES = \["search", "collection", "compare"\]/);
  assert.match(source, /SEALED_OWL_POSES\.includes\(current\.owl\) \? "v3-sealed-alpha" : "v2-alpha"/);
  assert.match(source, /loading="eager"/);
  assert.match(source, /aria-hidden="true"/);
  assert.doesNotMatch(source, /site-tour-card|site-tour-spark/);
  assert.doesNotMatch(css, /site-tour-card|@keyframes tour-card/);
  assert.match(css, /@keyframes tour-owl-in/);
  const panelStyle = css.match(/\.site-tour-panel\s*\{([^}]+)\}/)?.[1] ?? "";
  const mascotStyle = css.match(/\.site-tour-mascot\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(panelStyle, /background:\s*#091524;/);
  assert.doesNotMatch(panelStyle, /radial-gradient/);
  assert.match(mascotStyle, /background:\s*transparent/);
  assert.doesNotMatch(mascotStyle, /mix-blend-mode|mask-image|filter:|opacity:|border:|border-radius:/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  let totalBytes = 0;
  const require = createRequire(import.meta.url);
  const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));
  for (const pose of poses) {
    const sealed = ["search", "collection", "compare"].includes(pose);
    const asset = await readFile(new URL(`brand/tour/owl-${pose}-${sealed ? "v3-sealed-alpha" : "v2-alpha"}.webp`, output));
    assert.equal(asset.toString("ascii", 0, 4), "RIFF");
    assert.equal(asset.toString("ascii", 8, 12), "WEBP");
    assert.ok(asset.length < 200_000, `${pose} exceeds the lossless per-step asset budget`);
    const { data, info } = await sharp(asset).raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.channels, 4, `${pose} must have real alpha, not a painted backdrop`);
    assert.equal(info.width, 480);
    assert.equal(info.height, 480);
    const original = await sharp(await readFile(new URL(`../public/brand/tour/owl-${pose}-${sealed ? "v3-sealed-source" : "v1"}.webp`, import.meta.url))).raw().toBuffer();
    let transparent = 0;
    for (let p = 0; p < info.width * info.height; p++) {
      const alpha = data[p * 4 + 3];
      if (alpha === 0) transparent++;
      else for (let c = 0; c < 3; c++) assert.equal(data[p * 4 + c], original[p * 3 + c], `${pose}: original character colour changed`);
      const x = p % info.width, y = Math.floor(p / info.width);
      if (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1) assert.equal(alpha, 0, `${pose}: opaque image border`);
    }
    assert.ok(transparent > info.width * info.height * .4 && transparent < info.width * info.height * .8, `${pose}: invalid transparent area`);
    totalBytes += asset.length;
  }
  assert.ok(totalBytes < 1_000_000, "lossless tour illustrations exceed the total asset budget");
});

test("partner and legal pages contain required information", async () => {
  const [shops, terms, privacy] = await Promise.all([
    readOutput("pro-eshopy/index.html"),
    readOutput("podminky-pouziti/index.html"),
    readOutput("soukromi-a-cookies/index.html"),
  ]);

  assert.match(shops, /TCG Ceny pro e-shopy/);
  assert.match(shops, /Přímý odkaz na zdroj/);
  assert.match(shops, /Bez provize z objednávky/);
  assert.match(terms, /TCG Ceny není prodejce/);
  assert.doesNotMatch(privacy, /Petr Mládek/);
  assert.match(privacy, /podpora@tcgceny\.cz/);
});

test("production www requests redirect to the canonical host", () => {
  const redirect = canonicalHostRedirect(
    new Request("https://www.tcgceny.cz/katalog/?serie=ME05"),
  );

  assert.equal(redirect?.status, 308);
  assert.equal(
    redirect?.headers.get("location"),
    "https://tcgceny.cz/katalog/?serie=ME05",
  );
  assert.equal(
    canonicalHostRedirect(new Request("https://tcgceny.cz/katalog/")),
    null,
  );
  assert.equal(
    canonicalHostRedirect(new Request("http://localhost:3100/katalog/")),
    null,
  );
});

test("OAuth callbacks follow the approved current host", () => {
  assert.equal(
    oauthRedirectUri(
      new Request("https://tcgceny.cz/api/auth/discord"),
      "discord",
      "https://tcg-ceny-web.tcg-ceny.workers.dev/api/auth/discord/callback",
    ),
    "https://tcgceny.cz/api/auth/discord/callback",
  );
  assert.equal(
    oauthRedirectUri(
      new Request("https://tcg-ceny-web.tcg-ceny.workers.dev/api/auth/google"),
      "google",
    ),
    "https://tcg-ceny-web.tcg-ceny.workers.dev/api/auth/google/callback",
  );
  assert.equal(
    oauthRedirectUri(
      new Request("https://tcg-ceny-web-test.tcg-ceny.workers.dev/api/auth/discord"),
      "discord",
    ),
    "https://tcg-ceny-web-test.tcg-ceny.workers.dev/api/auth/discord/callback",
  );
  assert.equal(
    oauthRedirectUri(
      new Request("https://tcg-ceny-web-test.tcg-ceny.workers.dev/api/auth/google"),
      "google",
    ),
    "https://tcg-ceny-web-test.tcg-ceny.workers.dev/api/auth/google/callback",
  );
  assert.equal(
    oauthRedirectUri(
      new Request("https://tcg-ceny-web-test.p-mladek99.workers.dev/api/auth/discord"),
      "discord",
    ),
    "https://tcg-ceny-web-test.p-mladek99.workers.dev/api/auth/discord/callback",
  );
  assert.equal(
    oauthRedirectUri(
      new Request("https://tcg-ceny-web.p-mladek99.workers.dev/api/auth/google"),
      "google",
    ),
    "https://tcg-ceny-web.p-mladek99.workers.dev/api/auth/google/callback",
  );
  assert.equal(
    oauthRedirectUri(
      new Request("https://attacker.example/api/auth/discord"),
      "discord",
      "https://attacker.example/api/auth/discord/callback",
    ),
    null,
  );
});

test("search and security support files are production-ready", async () => {
  const [sitemap, robots, headers, alertControlSource] = await Promise.all([
    readOutput("sitemap.xml"),
    readOutput("robots.txt"),
    readOutput("_headers"),
    readFile(new URL("../app/katalog/ProductAlertControl.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(sitemap, /https:\/\/tcgceny\.cz\//);
  assert.match(sitemap, /katalog/);
  assert.match(sitemap, /portfolio/);
  assert.match(sitemap, /sledovani/);
  assert.match(sitemap, /porovnani/);
  assert.match(sitemap, /pro-eshopy/);
  assert.match(robots, /Sitemap: https:\/\/tcgceny\.cz\/sitemap\.xml/);
  assert.match(headers, /Content-Security-Policy/i);
  assert.match(headers, /Strict-Transport-Security/i);
  assert.match(headers, /X-Frame-Options:\s*DENY/i);
  assert.match(headers, /\/assets\/\*[\s\S]*max-age=31536000, immutable/i);
  assert.match(alertControlSource, /closeRef\.current\?\.focus\(\)/);
  assert.match(alertControlSource, /event\.key !== "Tab"/);
  const rioluTin = catalogData.products.find(
    (product) => product.id === "pm:ascended-heroes-mini-tin-riolu-darumaka",
  );
  assert.ok(rioluTin);
  assert.equal(rioluTin.bestPrice, null);
  assert.equal(rioluTin.availableOffers, 0);
  assert.doesNotMatch(rioluTin.name, /mini tin box/i);
});

test("alert proxy keeps ownership server-side and whitelists mutation fields", async () => {
  const secret = "alert-session-secret-for-tests";
  const cookie = await webSessionCookie(
    {
      sub: "discord:987654321",
      username: "Watcher",
      avatar: null,
      provider: "discord",
      exp: Math.floor(Date.now() / 1000) + 60,
    },
    secret,
  );
  const env = {
    SESSION_SECRET: secret,
    CENTRAL_API_BASE_URL: "https://backend.example",
    CENTRAL_API_SERVICE_TOKEN: "s".repeat(48),
  };

  const originalFetch = globalThis.fetch;
  let forwardedUrl = "";
  let forwardedInit;
  globalThis.fetch = async (input, init) => {
    forwardedUrl = String(input);
    forwardedInit = init;
    return Response.json({ items: [], total: 0, price_count: 0, restock_count: 0, target_reached_count: 0 });
  };
  try {
    const response = await handlePortfolioApi(
      new Request("https://tcgceny.cz/api/alerts/test%3Aproduct", {
        method: "PUT",
        headers: {
          Cookie: cookie,
          Origin: "https://tcgceny.cz",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kinds: ["price_below", "restock"],
          thresholdCzk: 899,
          channel: "discord",
          shops: ["Tolarie"],
          user_id: "attacker-controlled",
        }),
      }),
      env,
    );

    assert.equal(response.status, 200);
    assert.equal(forwardedUrl, "https://backend.example/api/v1/alerts/test%3Aproduct");
    assert.equal(forwardedInit.headers.get("X-TCG-Identity-Subject"), "987654321");
    assert.equal(forwardedInit.headers.get("Cookie"), null);
    assert.deepEqual(JSON.parse(forwardedInit.body), {
      kinds: ["price_below", "restock"],
      threshold_czk: 899,
      channel: "discord",
      shops: ["Tolarie"],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("watching proxy prefers the cached catalog image over blocked shop hotlinks", async () => {
  const secret = "watching-image-session-secret-1234567890";
  const cookie = await webSessionCookie(
    {
      sub: "discord:watching-image-user",
      username: "Watcher",
      avatar: null,
      provider: "discord",
      exp: Math.floor(Date.now() / 1000) + 60,
    },
    secret,
  );
  const product = catalogData.products.find((item) => item.id === "pm:me05-pitch-black-etb");
  assert.ok(product?.image?.startsWith("/catalog-products/"));

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    items: [{
      product: {
        id: product.id,
        name: product.name,
        image_url: "https://shop.example/blocked-hotlink.png",
        availability: "online",
        best_price_czk: 1799,
        checked_at: "2026-08-21T16:40:23Z",
        data_stale: false,
      },
      kinds: ["price_below"],
      threshold_czk: 1620,
      channel: "discord",
      shops: [],
      price_gap_czk: 179,
      target_reached: false,
      updated_at: "2026-08-21T16:40:23Z",
    }],
    total: 1,
    price_count: 1,
    restock_count: 0,
    target_reached_count: 0,
  });
  try {
    const response = await handlePortfolioApi(
      new Request("https://tcgceny.cz/api/alerts", {
        headers: { Cookie: cookie, Accept: "application/json" },
      }),
      {
        SESSION_SECRET: secret,
        CENTRAL_API_BASE_URL: "https://backend.example",
        CENTRAL_API_SERVICE_TOKEN: "s".repeat(48),
      },
    );
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.items[0].product.image_url, product.image);
    assert.doesNotMatch(payload.items[0].product.image_url, /shop\.example/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("alert event proxy exposes owned history and requires a valid mutation origin", async () => {
  const secret = "alert-event-session-secret-for-tests";
  const cookie = await webSessionCookie(
    {
      sub: "discord:987654321",
      username: "Watcher",
      avatar: null,
      provider: "discord",
      exp: Math.floor(Date.now() / 1000) + 60,
    },
    secret,
  );
  const env = {
    SESSION_SECRET: secret,
    CENTRAL_API_BASE_URL: "https://backend.example",
    CENTRAL_API_SERVICE_TOKEN: "s".repeat(48),
  };
  const originalFetch = globalThis.fetch;
  const forwarded = [];
  globalThis.fetch = async (input, init) => {
    forwarded.push({ url: String(input), init });
    return init.method === "POST"
      ? new Response(null, { status: 204 })
      : Response.json({ items: [], total: 0, unread: 0 });
  };
  try {
    const listResponse = await handlePortfolioApi(
      new Request("https://tcgceny.cz/api/alerts/events", {
        headers: { Cookie: cookie, Accept: "application/json" },
      }),
      env,
    );
    assert.equal(listResponse.status, 200);
    assert.equal(forwarded[0].url, "https://backend.example/api/v1/alerts/events");
    assert.equal(forwarded[0].init.headers.get("X-TCG-Identity-Subject"), "987654321");

    const rejected = await handlePortfolioApi(
      new Request("https://tcgceny.cz/api/alerts/events/read", {
        method: "POST",
        headers: { Cookie: cookie, Origin: "https://attacker.example" },
      }),
      env,
    );
    assert.equal(rejected.status, 403);

    const readResponse = await handlePortfolioApi(
      new Request("https://tcgceny.cz/api/alerts/events/read", {
        method: "POST",
        headers: { Cookie: cookie, Origin: "https://tcgceny.cz" },
      }),
      env,
    );
    assert.equal(readResponse.status, 204);
    assert.equal(forwarded[1].url, "https://backend.example/api/v1/alerts/events/read");
    assert.equal(forwarded[1].init.method, "POST");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("every catalog product has a stable, indexable detail page", async () => {
  const slugs = catalogData.products.map((product) => productSlug(product));
  assert.equal(new Set(slugs).size, catalogData.products.length, "product slugs must be unique");

  await Promise.all(catalogData.products.map(async (product) => {
    const path = productPath(product);
    assert.match(path, /^\/produkt\/[a-z0-9-]+\/$/);
    const html = await readOutput(`${path.slice(1)}index.html`);
    assert.match(html, new RegExp(product.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, /application\/ld\+json/);
    assert.match(html, /Nastavit upozornění/);
    assert.match(html, new RegExp(`https://tcgceny\\.cz${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  }));

  const catalogHtml = await readOutput("katalog/index.html");
  assert.match(catalogHtml, new RegExp(productPath(catalogData.products[0]).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const response = handleSitemap(new Request("https://tcgceny.cz/sitemap.xml"));
  const sitemap = await response.text();
  assert.equal((sitemap.match(/<url>/g) || []).length, catalogData.products.length + 9);
  assert.match(sitemap, new RegExp(productPath(catalogData.products.at(-1)).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("product alert controls save an authenticated accessible configuration", async () => {
  const [control, catalogCss, catalog, detail] = await Promise.all([
    readFile(new URL("../app/katalog/ProductAlertControl.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/katalog/catalog.css", import.meta.url), "utf8"),
    readOutput("katalog/index.html"),
    readOutput("produkt/me05-pitch-black-booster-bundle-03popd8/index.html"),
  ]);

  assert.match(catalog, /Nastavit upozornění produktu/);
  assert.match(detail, /Nastavit upozornění/);
  assert.match(control, /<span>Sledování<\/span>/);
  assert.match(control, /Nastavit upozornění/);
  assert.match(catalogCss, /\.alert-dialog\s*\{[^}]*overflow:\s*clip/);
  assert.match(control, /role="dialog"/);
  assert.match(control, /aria-modal="true"/);
  assert.match(control, /event\.key === "Escape"/);
  assert.match(control, /Naskladnění/);
  assert.match(control, /Pokles ceny/);
  assert.match(control, /Cílová cena/);
  assert.match(control, /Všechny ověřené/);
  assert.match(control, /Discord/);
  assert.match(control, /Uložit upozornění/);
  assert.match(control, /return String\(Math\.max\(1, Math\.round\(price\)\)\)/);
  assert.doesNotMatch(control, /price \* 0\.9/);
  assert.match(control, /setTargetPrice\(existing\.threshold_czk === null \? "" : String\(existing\.threshold_czk\)\)/);
  assert.match(control, /fetch\(`\/api\/alerts\/\$\{encodeURIComponent\(product\.id\)\}`/);
  assert.match(control, /method: "PUT"/);
  assert.match(control, /Sledování je bezpečně uložené v tvém účtu/);
  assert.match(control, /fetch\("\/api\/session"/);
  assert.match(control, /credentials: "include"/);
  assert.match(control, /Upozornění jsou dostupná po přihlášení/);
  assert.match(control, /Pouze pro přihlášené uživatele/);
  assert.match(control, /showLoginChoices/);
  assert.match(control, /Přihlásit se/);
  assert.match(control, /Vyber způsob přihlášení/);
  assert.match(control, /firstLoginRef\.current\?\.focus\(\)/);
  assert.match(control, /\/api\/auth\/\$\{provider\}/);
  assert.match(control, /a\[href\], button:not\(\[disabled\]\)/);
  assert.doesNotMatch(control, /localStorage|sessionStorage/);
});

test("watching dashboard is private, useful and linked from navigation", async () => {
  const [html, source, mobileNav, authMenu, alertControl, detailClient, navStatus] = await Promise.all([
    readOutput("sledovani/index.html"),
    readFile(new URL("../app/sledovani/SledovaniClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/MobileNav.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/AuthMenu.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/katalog/ProductAlertControl.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/produkt/[slug]/ProductPageClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/NavStatusLink.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(html, /Co sleduješ/);
  assert.match(source, /fetch\("\/api\/alerts"/);
  assert.match(source, /Aktuální cena/);
  assert.match(source, /Tvůj limit/);
  assert.match(source, /Do limitu/);
  assert.match(source, /Všechny ověřené obchody/);
  assert.match(source, /WatchingProductImage/);
  assert.match(source, /onError=\{\(\) => setFailedSource\(source\)\}/);
  assert.match(source, /\?upozorneni=upravit/);
  assert.match(detailClient, /openFromQuery/);
  assert.match(alertControl, /params\.get\("upozorneni"\).*"upravit"/);
  assert.match(alertControl, /setRedirectAfterSave\("\/sledovani\/"\)/);
  assert.match(alertControl, /window\.location\.replace\(redirectAfterSave\)/);
  assert.match(alertControl, /setRedirectAfterSave\(null\)/);
  assert.match(source, /method: "DELETE"/);
  assert.match(source, /Každý uživatel vidí jen své produkty/);
  assert.match(source, /Cíl splněn/);
  assert.match(source, /watching-result/);
  assert.match(source, /watching-result-new-dot/);
  assert.match(source, /api\/alerts\/events\/read/);
  assert.match(source, /notifyAlertsRead/);
  assert.match(source, /nahled-alertu/);
  assert.match(source, /\["localhost", "127\.0\.0\.1"\]/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.match(mobileNav, /\/sledovani\//);
  assert.match(mobileNav, /NavStatusLink/);
  assert.match(authMenu, /Moje sledování/);
  assert.match(navStatus, /api\/alerts\/events/);
  assert.match(navStatus, /nav-alert-count/);
  assert.match(navStatus, /api\/catalog\/changes\?days=30&limit=1/);
  assert.match(navStatus, /tcg-ceny:last-seen-market-change:v1/);
  assert.match(navStatus, /nav-new-drop/);
  assert.match(navStatus, /PRICE_DROP_REFRESH_INTERVAL_MS = 5 \* 60 \* 1000/);
  assert.match(navStatus, /visibilitychange/);
  assert.match(navStatus, /window\.addEventListener\("focus"/);
  assert.match(navStatus, /window\.addEventListener\("online"/);
  assert.match(navStatus, /cache: "no-store"/);
});

test("catalog issue reports require a verified signed-in user", async () => {
  const [control, detail, detailClient] = await Promise.all([
    readFile(new URL("../app/katalog/CatalogIssueReportControl.tsx", import.meta.url), "utf8"),
    readOutput("produkt/me05-pitch-black-booster-bundle-03popd8/index.html"),
    readFile(new URL("../app/produkt/[slug]/ProductPageClient.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(detail, /Nahlásit problém/);
  assert.match(control, /catalog-product-report-corner/);
  assert.match(detailClient, /variant="corner"/);
  assert.doesNotMatch(detailClient, /catalog-detail-feedback/);
  assert.match(control, /fetch\("\/api\/session"/);
  assert.match(control, /sessionState !== "authenticated"/);
  assert.match(control, /pouze přihlášení uživatelé/);
  assert.match(control, /Přihlásit se/);
  assert.match(control, /\/api\/auth\/\$\{provider\}/);
  assert.match(control, /loginHref\("discord"\)/);
  assert.match(control, /loginHref\("google"\)/);
});

test("product detail links the best current price directly to its verified shop", async () => {
  const [source, detail] = await Promise.all([
    readFile(new URL("../app/produkt/[slug]/ProductPageClient.tsx", import.meta.url), "utf8"),
    readOutput("produkt/me05-pitch-black-booster-bundle-03popd8/index.html"),
  ]);

  assert.match(source, /import \{ safeShopUrl \} from "\.\.\/\.\.\/shop-url"/);
  assert.match(source, /const offerUrl = safeShopUrl\(offer\.url\)/);
  assert.match(source, /rel="noopener noreferrer"/);
  assert.match(source, /Otevřít nejlevnější nabídku produktu/);
  assert.match(detail, /Nejlevněji u/);
  assert.match(detail, /Otevřít nabídku/);
  assert.match(detail, /target="_blank"/);
});
