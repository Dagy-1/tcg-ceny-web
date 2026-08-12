import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { handleCatalogApi } from "../worker/catalog-api.ts";
import { canonicalHostRedirect } from "../worker/canonical-host.ts";
import { handleSitemap } from "../worker/sitemap.ts";
import {
  centralPortfolioRequest,
  handlePortfolioApi,
  oauthRedirectUri,
} from "../worker/portfolio-api.ts";

const output = new URL("../out/", import.meta.url);

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
    access(new URL("portfolio/index.html", output)),
    access(new URL("portfolio-products.json", output)),
    access(new URL("pro-eshopy/index.html", output)),
    access(new URL("podminky-pouziti/index.html", output)),
    access(new URL("soukromi-a-cookies/index.html", output)),
    access(new URL("sitemap.xml", output)),
    access(new URL("robots.txt", output)),
    access(new URL("_headers", output)),
    access(new URL("404.html", output)),
  ]);
});

test("portfolio uses the dedicated investment database", async () => {
  const [portfolio, portfolioDataText, publicPortfolioDataText, portfolioSource, catalog, catalogSource, privacy, authMenuSource] = await Promise.all([
    readOutput("portfolio/index.html"),
    readFile(new URL("../app/portfolio/portfolio-data.json", import.meta.url), "utf8"),
    readOutput("portfolio-products.json"),
    readFile(new URL("../app/portfolio/PortfolioClient.tsx", import.meta.url), "utf8"),
    readOutput("katalog/index.html"),
    readFile(new URL("../app/katalog/CatalogClient.tsx", import.meta.url), "utf8"),
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
  assert.match(portfolioSource, /method: "PATCH"/);
  assert.match(portfolioSource, /Upravit produkt/);
  assert.match(portfolioSource, /Vývoj hodnoty sbírky/);
  assert.match(portfolioSource, /Vývoj ukázkové sbírky/);
  assert.match(portfolioSource, /setDemoPeriod/);
  assert.match(portfolioSource, /demo\?: boolean/);
  assert.match(portfolioSource, /productDescriptor/);
  assert.match(portfolioSource, /Ilustrační demo · skutečné portfolio používá denní cenové záznamy/);
  assert.match(portfolioSource, /api\/portfolio\/history/);
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
  assert.match(catalogSource, /Přidat do portfolia/);
  assert.match(privacy, /Discord ID/);
  assert.match(privacy, /Přihlášení přes Google/);
  assert.match(privacy, /technicky nezbytnou zabezpečenou cookie/);
});

test("production sitemap is served without a trailing-slash redirect", async () => {
  const response = handleSitemap(new Request("https://tcgceny.cz/sitemap.xml"));
  assert.ok(response);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type") ?? "", /^application\/xml/);
  assert.match(await response.text(), /<loc>https:\/\/tcgceny\.cz\/katalog\/<\/loc>/);

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

  assert.match(client, /fetch\(`\/api\/catalog\/products\?limit=100/);
  assert.match(client, /items\.length !== total/);
  assert.match(client, /embedded build snapshot is the deliberate availability fallback/);
  assert.match(client, /api\/catalog\/products\/\$\{encodeURIComponent\(product\.id\)\}/);
  assert.match(proxy, /CENTRAL_API_BASE_URL/);
  assert.match(proxy, /REQUEST_TIMEOUT_MS = 5_000/);
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

  assert.match(html, /<html lang="cs"(?:\s[^>]*)?>/i);
  assert.match(html, /TCG Ceny \| Ceny, skladovost a alerty Pokémon TCG/i);
  assert.match(html, /https:\/\/tcgceny\.cz/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /Chyť nejlepší cenu/);
  assert.match(html, /Nezmeškej naskladnění/);
  assert.match(html, /Historie cen/);
  assert.match(html, /Portfolio sbírky/);
  assert.match(html, /https:\/\/discord\.gg\/pRC8GKAKxG/);
  assert.match(html, /podpora@tcgceny\.cz/);
  assert.doesNotMatch(
    html,
    /codex-preview|chatgpt|openai|Your site is taking shape|react-loading-skeleton/i,
  );
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
  assert.match(privacy, /Petr Mládek/);
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
  const [sitemap, robots, headers] = await Promise.all([
    readOutput("sitemap.xml"),
    readOutput("robots.txt"),
    readOutput("_headers"),
  ]);

  assert.match(sitemap, /https:\/\/tcgceny\.cz\//);
  assert.match(sitemap, /katalog/);
  assert.match(sitemap, /portfolio/);
  assert.match(sitemap, /pro-eshopy/);
  assert.match(robots, /Sitemap: https:\/\/tcgceny\.cz\/sitemap\.xml/);
  assert.match(headers, /Content-Security-Policy/i);
  assert.match(headers, /Strict-Transport-Security/i);
  assert.match(headers, /X-Frame-Options:\s*DENY/i);
});
