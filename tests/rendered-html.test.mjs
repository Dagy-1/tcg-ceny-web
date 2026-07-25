import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/", origin = "http://localhost") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`${origin}${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server renders the Czech TCG Ceny landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("permissions-policy"), "camera=(), geolocation=(), microphone=(), payment=(), usb=()");

  const secureResponse = await render("/", "https://tcgceny.cz");
  assert.equal(
    secureResponse.headers.get("strict-transport-security"),
    "max-age=31536000; includeSubDomains",
  );
  await secureResponse.body?.cancel();

  const html = await response.text();
  assert.match(html, /<html lang="cs">/i);
  assert.match(html, /<title>TCG Ceny \| Ceny, skladovost a alerty Pokémon TCG<\/title>/i);
  assert.match(html, /Chyť nejlepší cenu/);
  assert.match(html, /Nezmeškej naskladnění/);
  assert.match(html, /Historie cen/);
  assert.match(html, /Portfolio sbírky/);
  assert.match(html, /https:\/\/discord\.gg\/pRC8GKAKxG/);
  assert.match(html, /podpora@tcgceny\.cz/);
  assert.match(html, /Nezávislý komunitní projekt/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("server renders the dedicated page for e-shops", async () => {
  const response = await render("/pro-eshopy");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /TCG Ceny pro e-shopy/);
  assert.match(html, /Přímá cesta k zákazníkovi/);
  assert.match(html, /podpora@tcgceny\.cz/);
  assert.match(html, /Přímý odkaz na zdroj/);
  assert.match(html, /Bez provize z objednávky/);
  assert.match(html, /TCG Ceny není tržiště/);
  assert.match(html, /Spolupráci nastavíme ve třech krocích/);
});

test("production source is responsive and free of starter preview code", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /const DISCORD_URL/);
  assert.match(page, /Chaos Rising ETB/);
  assert.match(layout, /<html lang="cs">/);
  assert.match(layout, /metadataBase: new URL\("https:\/\/tcgceny\.cz"\)/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page + layout, /codex-preview|_sites-preview|SkeletonPreview/);

  await assert.rejects(
    access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)),
  );
});
