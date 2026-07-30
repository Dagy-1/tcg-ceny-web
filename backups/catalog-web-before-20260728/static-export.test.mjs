import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const output = new URL("../out/", import.meta.url);

async function readOutput(path) {
  return readFile(new URL(path, output), "utf8");
}

test("static export contains every public page", async () => {
  await Promise.all([
    access(new URL("index.html", output)),
    access(new URL("pro-eshopy/index.html", output)),
    access(new URL("podminky-pouziti/index.html", output)),
    access(new URL("soukromi-a-cookies/index.html", output)),
    access(new URL("sitemap.xml", output)),
    access(new URL("robots.txt", output)),
    access(new URL("_headers", output)),
  ]);
});

test("homepage contains production metadata and core content", async () => {
  const html = await readOutput("index.html");

  assert.match(html, /<html lang="cs">/i);
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

test("search and security support files are production-ready", async () => {
  const [sitemap, robots, headers] = await Promise.all([
    readOutput("sitemap.xml"),
    readOutput("robots.txt"),
    readOutput("_headers"),
  ]);

  assert.match(sitemap, /https:\/\/tcgceny\.cz\//);
  assert.match(sitemap, /pro-eshopy/);
  assert.match(robots, /Sitemap: https:\/\/tcgceny\.cz\/sitemap\.xml/);
  assert.match(headers, /Content-Security-Policy/i);
  assert.match(headers, /Strict-Transport-Security/i);
  assert.match(headers, /X-Frame-Options:\s*DENY/i);
});
