import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../app/sledovani/SledovaniClient.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/sledovani/sledovani.css', import.meta.url), 'utf8');

test('watching price gap appears once and progress retains an accessible value', () => {
  const card = source.slice(source.indexOf('<article className="watching-card"'));
  assert.equal((card.match(/formatPrice\(item.price_gap_czk\)/g) || []).length, 1);
  assert.doesNotMatch(card, /K cíli zbývá/);
  assert.match(card, /role="progressbar"[^>]*aria-valuenow=\{progress\(item\)\}/);
  assert.match(card, /hasPriceRule && item.threshold_czk !== null && item.product.best_price_czk !== null && !item.product.data_stale/);
  assert.match(css, /\.watching-values \{[^}]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(css, /\.watching-values[^}]*grid-template-columns: 1fr 1fr;/);
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
