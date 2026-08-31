import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../app/sledovani/SledovaniClient.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/sledovani/sledovani.css', import.meta.url), 'utf8');

test('watching price and target are separate with no misleading progress', async () => {
  const card = source.slice(source.indexOf('<article className="watching-card"'));
  assert.match(card, /<WatchingPriceSummary/);
  assert.doesNotMatch(card, /progressbar|watching-progress|history=\{/);
  assert.match(card, /stale=\{item.product.data_stale \|\| !item.product.checked_at\}/);
  assert.doesNotMatch(css, /watching-progress/);
  const summary = await readFile(new URL('../app/sledovani/WatchingPriceSummary.tsx', import.meta.url), 'utf8');
  assert.equal((summary.match(/money\(values.gap\)/g) || []).length, 1);
  assert.match(summary, /Srovnání s cenou před 7 dny zatím není dostupné/);
  assert.match(summary, /Tvůj cenový limit/);
});

test('informational pills are spans and actions preserve edit and removal confirmation', () => {
  assert.match(source, /<span className="watching-rule"><Package/);
  assert.match(source, /<span className="watching-rule"><ArrowDown/);
  assert.match(source, /<span className="watching-channel"/);
  assert.match(source, /href=\{`\$\{path\}\?upozorneni=upravit`\}[^>]*>Upravit<\/Link>/);
  assert.match(source, /confirmId === item.product.id/);
  assert.match(source, /Ano, odebrat/);
  assert.match(source, /setConfirmId\(null\)/);
  assert.match(css, /\.watching-card-footer \.watching-remove \{[^}]*color: #ff8585/);
});

test('verification remains truthful when timestamps and shop counts are missing', () => {
  assert.match(source, /Všechny ověřené obchody/);
  assert.match(source, /Hlídáš \$\{count\}/);
  assert.doesNotMatch(source, /Ověřeno u 8 obchodů/);
  assert.match(source, /shopScopeLabel\(item.shops\)\} · \{formatCheckedAt\(item.product.checked_at\)/);
  assert.match(source, /data čekají na obnovení/);
});

test('local visual scenarios are loopback-only and cannot delete real rules', () => {
  assert.match(source, /\["localhost", "127\.0\.0\.1"\].includes\(window.location.hostname\)/);
  const remove = source.slice(source.indexOf('const removeAlert ='), source.indexOf('  return (\n    <>', source.indexOf('const removeAlert =')));
  assert.ok(remove.indexOf('if (previewMode)') < remove.indexOf('await fetch('));
  assert.match(remove, /if \(previewMode\) \{\s*setConfirmId\(null\);\s*return;/);
});
