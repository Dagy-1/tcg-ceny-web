import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const demo = await read('../app/FeaturePreview.tsx');
const compare = await read('../app/porovnani/CompareClient.tsx');
const watching = await read('../app/sledovani/SledovaniClient.tsx');

test('public previews disclose illustrative prices and never load or save demo products', () => {
  assert.match(demo, /Skutečné produkty, ilustrační ceny/);
  assert.match(demo, /Ilustrační ceny a vývoj/);
  assert.match(demo, /Žádné sledování zatím není aktivní/);
  assert.doesNotMatch(demo, /fetch\(|sessionStorage|localStorage|\/api\//);
  assert.equal((demo.match(/<b>DEMO<\/b>/g) || []).length, 2);
});

test('demo uses existing real Pitch Black cutouts without destructive background effects', async () => {
  assert.match(demo, /ME05 Pitch Black ETB/);
  assert.match(demo, /Pitch Black Booster Bundle/);
  assert.doesNotMatch(demo, /function SealedBox/);
  for (const name of ['978abcdf7fd3af65.png', '7f159cfe60fa66d4.png']) {
    assert.ok(demo.includes(name));
    const png = await readFile(new URL(`../public/catalog-products/${name}`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png[25], 6, 'reviewed cutout retains RGBA transparency');
  }
  const css = await read('../app/feature-preview.css');
  assert.match(css, /object-fit: contain/);
  assert.doesNotMatch(css, /mix-blend-mode|clip-path|mask-image/);
});

test('comparison preview is only an empty state and CTA focuses real product search', () => {
  assert.match(compare, /const showPreview = !started && mine.length === 0 && compared.length === 0/);
  assert.match(compare, /<ComparisonPreview onStart=\{\(\) => setStarted\(true\)\} disabled=\{!ready\}/);
  assert.match(compare, /document.getElementById\("compare-mine-search"\)\?\.focus\(\)/);
  assert.match(compare, /<section hidden=\{showPreview\} className="compare-workspace shell"/);
  assert.match(compare, /if \(!ready\) return;/);
});

test('comparison centers its difference and marks higher value without claiming a better deal', async () => {
  const preview = demo.slice(demo.indexOf('export function ComparisonPreview'), demo.indexOf('export function WatchingPreview'));
  assert.match(demo, /className=\{bundle \? undefined : "feature-side-higher"\}/);
  assert.match(demo, /!bundle && <span className="feature-value-badge">Vyšší hodnota/);
  assert.match(preview, /Rozdíl hodnoty<\/span><strong>200 Kč/);
  assert.doesNotMatch(preview, /lepší nákup|výhodnější nabídka/i);
  const css = await read('../app/feature-preview.css');
  assert.match(css, /\.feature-demo-verdict \{[^}]*justify-items: center[^}]*text-align: center/);
});

test('demo swap is local, reversible and updates both products and settlement direction', () => {
  assert.match(demo, /const \[swapped, setSwapped\] = useState\(false\)/);
  assert.match(demo, /onClick=\{\(\) => setSwapped\(value => !value\)\}/);
  assert.match(demo, /<ComparisonDemoSide bundle=\{swapped\} label="Můj výběr"/);
  assert.match(demo, /<ComparisonDemoSide bundle=\{!swapped\} label="Srovnávaný výběr"/);
  assert.match(demo, /swapped \? "K dorovnání přidej tuto částku ke svému výběru\." : "K dorovnání přidej tuto částku ke srovnávanému výběru\."/);
  assert.match(demo, /id="compare-demo-result" aria-live="polite" aria-atomic="true"/);
  assert.doesNotMatch(demo, /setMine|setCompared|fetch\(|sessionStorage|localStorage/);
});

test('comparison FAQ describes mixed price sources and indicative values', () => {
  const preview = demo.slice(demo.indexOf('export function ComparisonPreview'), demo.indexOf('export function WatchingPreview'));
  assert.match(preview, /aria-labelledby="compare-help-title"/);
  assert.equal((preview.match(/<details>/g) || []).length, 3);
  assert.match(preview, /Cardmarketu používáme průměrnou cenu/);
  assert.match(preview, /PokeData nebo nabídky českých obchodů/);
  assert.match(preview, /orientační hodnotu pro porovnání/);
  assert.match(preview, /Rozdíl spočítáme z celkové hodnoty/);
  assert.doesNotMatch(preview, /<details open/);
});

test('watching preview is anonymous-only and keeps existing sign-in return paths', () => {
  const anonymous = watching.slice(watching.indexOf('{state === "anonymous" && ('), watching.indexOf('{state === "error" && ('));
  assert.match(anonymous, /<WatchingPreview \/>/);
  assert.match(anonymous, /aria-expanded=\{loginOpen\}/);
  assert.match(anonymous, /\/api\/auth\/discord\?return_to=%2Fsledovani%2F/);
  assert.match(anonymous, /\/api\/auth\/google\?return_to=%2Fsledovani%2F/);
  assert.doesNotMatch(anonymous, /removeAlert|setPreviewMode|setData/);
});

test('watching demo has compact native FAQ and a separate public market link', async () => {
  const preview = demo.slice(demo.indexOf('export function WatchingPreview'));
  assert.match(preview, /className="watching-preview-column"/);
  assert.match(preview, /aria-labelledby="watching-help-title"/);
  assert.equal((preview.match(/<details>/g) || []).length, 3);
  assert.equal((preview.match(/<summary>/g) || []).length, 3);
  assert.doesNotMatch(preview, /<details open|onClick|fetch\(/);
  assert.match(preview, /Jakmile potvrdíme nový pokles ceny na tvůj limit nebo níž\./);
  assert.match(preview, /Ano, cenový limit nemusíš nastavovat\./);
  assert.match(preview, /Ne\. Upozornění najdeš na webu, volitelně i přes propojený Discord\./);
  assert.match(preview, /Prohlédnout slevy a naskladnění/);
  assert.doesNotMatch(preview, /Po uložení se nejprve|Chceš nejdřív omrknout trh/);
  assert.match(preview, /href="\/zlevneni\/"/);
  const css = await read('../app/feature-preview.css');
  assert.match(css, /\.watching-intro \{[^}]*align-items: start/);
  assert.match(css, /summary:focus-visible/);
});

test('larger intro typography is scoped to anonymous watching and adapts to mobile', async () => {
  const css = await read('../app/feature-preview.css');
  assert.match(css, /\.watching-intro \.feature-preview-copy h2 \{[^}]*clamp\(34px, 3\.5vw, 46px\)/);
  assert.match(css, /\.watching-intro \.feature-steps small \{[^}]*font-size: 14px/);
  assert.match(css, /\.watching-intro \.watching-login > button \{[^}]*min-height: 50px/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*clamp\(30px, 7\.8vw, 40px\)/);
});
