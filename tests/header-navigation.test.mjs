import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const pages = ["page.tsx", "katalog/CatalogClient.tsx", "zlevneni/PriceDropsClient.tsx",
  "porovnani/CompareClient.tsx", "portfolio/PortfolioClient.tsx", "sledovani/SledovaniClient.tsx",
  "pro-eshopy/page.tsx", "produkt/[slug]/ProductPageClient.tsx",
  "podminky-pouziti/page.tsx", "soukromi-a-cookies/page.tsx"];

test("public headers share account then mobile navigation in DOM order", async () => {
  const shared = await readFile(new URL("../app/HeaderActions.tsx", import.meta.url), "utf8");
  assert.match(shared, /<AuthMenu\s*\/>\s*<MobileNav\s*\/>/);
  for (const page of pages) {
    const source = await readFile(new URL(`../app/${page}`, import.meta.url), "utf8");
    assert.match(source, /<HeaderActions\s*\/>/, page);
    assert.doesNotMatch(source, /<(?:AuthMenu|MobileNav)\s*\/>/, page);
  }
});

test("every exported public header renders auth before menu, including product details", async () => {
  const routes = ["", "katalog/", "zlevneni/", "porovnani/", "portfolio/", "sledovani/",
    "pro-eshopy/", "podminky-pouziti/", "soukromi-a-cookies/"];
  const products = await readdir(new URL("../out/produkt/", import.meta.url), { withFileTypes: true });
  routes.push(...products.filter(entry => entry.isDirectory()).map(entry => `produkt/${entry.name}/`));
  for (const route of routes) {
    const html = await readFile(new URL(`../out/${route}index.html`, import.meta.url), "utf8");
    const nav = html.match(/<nav\b[^>]*class="nav\b[\s\S]*?<\/nav>/)?.[0] ?? "";
    const authIndex = nav.indexOf('class="auth-menu"');
    const menuIndex = nav.indexOf('class="mobile-nav"');
    assert.ok(authIndex > 0 && menuIndex > authIndex, route || "home");
    assert.match(nav, /aria-controls="mobile-navigation"/, route);
  }
});
