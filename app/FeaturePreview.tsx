"use client";

import { useState } from "react";
import { ArrowDown, ArrowLeftRight, ArrowUpRight, ChevronDown, Package } from "lucide-react";
import Image from "next/image";
import WatchingPriceSummary from "./sledovani/WatchingPriceSummary";
import "./feature-preview.css";

/** Existing reviewed transparent product photos; prices remain illustrative. */
function ProductPhoto({ bundle = false }: { bundle?: boolean }) {
  const src = bundle ? "/catalog-products/7f159cfe60fa66d4.png?v=4" : "/catalog-products/978abcdf7fd3af65.png?v=4";
  const name = bundle ? "Pitch Black Booster Bundle" : "Pitch Black ETB";
  return (
    <div className={`feature-product-photo${bundle ? " is-pair" : ""}`}>
      {bundle && <Image src={src} alt="" aria-hidden="true" width={491} height={700} unoptimized />}
      <Image src={src} alt={bundle ? `2× ${name}` : name} width={bundle ? 491 : 698} height={bundle ? 700 : 668} unoptimized />
    </div>
  );
}

function ComparisonDemoSide({ bundle, label }: { bundle: boolean; label: string }) {
  return (
    <div className={bundle ? undefined : "feature-side-higher"}>
      <span className="feature-side-label">{label}</span>
      <ProductPhoto bundle={bundle} />
      <strong>{bundle ? "Pitch Black Booster Bundle" : "Pitch Black ETB"}</strong>
      <small>{bundle ? "2 kusy × 800 Kč" : "1 kus · cena v ukázce"}</small>
      <b>{bundle ? "1 600 Kč" : "1 800 Kč"}</b>
      {!bundle && <span className="feature-value-badge">Vyšší hodnota</span>}
    </div>
  );
}

export function ComparisonPreview({ onStart, disabled }: { onStart: () => void; disabled: boolean }) {
  const [swapped, setSwapped] = useState(false);
  return (
    <section className="feature-preview compare-preview shell" aria-labelledby="compare-preview-title">
      <div className="feature-preview-copy">
        <span className="feature-preview-label">TAKHLE TO FUNGUJE</span>
        <h2 id="compare-preview-title">Dva výběry.<br />Jeden jasný rozdíl.</h2>
        <p>Pitch Black ETB, nebo dva Booster Bundly? Vyber produkty na obě strany a hned uvidíš, jak se jejich hodnoty liší.</p>
        <ol className="feature-steps">
          <li><span>1</span><div><strong>Vyber produkty</strong><small>Na každou stranu přidej vlastní kombinaci.</small></div></li>
          <li><span>2</span><div><strong>Nastav počet kusů</strong><small>Porovnáš jeden box i celou hromádku.</small></div></li>
          <li><span>3</span><div><strong>Uvidíš rozdíl v Kč</strong><small>Včetně částky k případnému dorovnání.</small></div></li>
        </ol>
        <button className="feature-start" type="button" onClick={onStart} disabled={disabled}>Vytvořit vlastní porovnání <ArrowLeftRight size={17} aria-hidden="true" /></button>
        <small className="feature-preview-note">Bez přihlášení · nic nekupuješ ani neobjednáváš</small>
      </div>
      <div className="compare-preview-column">
      <div className="feature-demo" aria-label="Ilustrační ukázka porovnání">
        <div className="feature-demo-heading"><span>UKÁZKA POROVNÁNÍ</span><b>DEMO</b></div>
        <div className="feature-demo-sides">
          <ComparisonDemoSide bundle={swapped} label="Můj výběr" />
          <span className="feature-demo-vs" aria-hidden="true">VS</span>
          <ComparisonDemoSide bundle={!swapped} label="Srovnávaný výběr" />
        </div>
        <div className="feature-demo-actions">
          <button className="feature-demo-swap" type="button" onClick={() => setSwapped(value => !value)} aria-controls="compare-demo-result"><ArrowLeftRight size={16} aria-hidden="true" />Prohodit výběry</button>
        </div>
        <div className="feature-demo-verdict" id="compare-demo-result" aria-live="polite" aria-atomic="true"><span>Rozdíl hodnoty</span><strong>200 Kč</strong><p>{swapped ? "K dorovnání přidej tuto částku ke svému výběru." : "K dorovnání přidej tuto částku ke srovnávanému výběru."}</p></div>
        <p className="feature-demo-disclaimer">Skutečné produkty, ilustrační ceny. Ukázka se neukládá do tvého výběru.</p>
      </div>
      <section className="feature-preview-help" aria-labelledby="compare-help-title">
        <h3 id="compare-help-title">Jak porovnání funguje</h3>
        <details>
          <summary>Odkud bereme ceny?<ChevronDown size={16} aria-hidden="true" /></summary>
          <p>U Cardmarketu používáme průměrnou cenu z tohoto evropského tržiště přepočtenou do Kč. Podle produktu využíváme i PokeData nebo nabídky českých obchodů.</p>
        </details>
        <details>
          <summary>Je to cena, za kterou produkt koupím?<ChevronDown size={16} aria-hidden="true" /></summary>
          <p>Ne, jde o orientační hodnotu pro porovnání. Aktuální cenu a dopravu ověř přímo v obchodě.</p>
        </details>
        <details>
          <summary>Můžu porovnat více boxů najednou?<ChevronDown size={16} aria-hidden="true" /></summary>
          <p>Ano. Na obě strany přidej produkty a nastav počty kusů. Rozdíl spočítáme z celkové hodnoty každého výběru.</p>
        </details>
      </section>
      </div>
    </section>
  );
}

export function WatchingPreview() {
  return (
    <div className="watching-preview-column">
    <div className="feature-demo watching-preview" aria-label="Ilustrační ukázka sledování">
      <div className="feature-demo-heading"><span>TAKHLE VYPADÁ TVOJE HLÍDÁNÍ</span><b>DEMO</b></div>
      <div className="watching-demo-product"><ProductPhoto /><div><span>MEGA EVOLUTION · ELITE TRAINER BOX</span><h3>ME05 Pitch Black ETB</h3><div className="watching-demo-tags"><span><Package size={12} aria-hidden="true" /> Naskladnění</span><span><ArrowDown size={12} aria-hidden="true" /> Pokles ceny</span></div></div></div>
      <WatchingPriceSummary price={1799} threshold={1620} history={{ price: 1999, label: "Před 7 dny", period: "za posledních 7 dní" }} />
      <p className="feature-demo-disclaimer">Ilustrační ceny a vývoj. Žádné sledování zatím není aktivní.</p>
    </div>
    <section className="watching-preview-help" aria-labelledby="watching-help-title">
      <h3 id="watching-help-title">Jak hlídání funguje</h3>
      <details>
        <summary>Kdy mi přijde upozornění?<ChevronDown size={16} aria-hidden="true" /></summary>
        <p>Jakmile potvrdíme nový pokles ceny na tvůj limit nebo níž.</p>
      </details>
      <details>
        <summary>Jde hlídat jen naskladnění?<ChevronDown size={16} aria-hidden="true" /></summary>
        <p>Ano, cenový limit nemusíš nastavovat.</p>
      </details>
      <details>
        <summary>Musím mít Discord?<ChevronDown size={16} aria-hidden="true" /></summary>
        <p>Ne. Upozornění najdeš na webu, volitelně i přes propojený Discord.</p>
      </details>
      <a className="watching-preview-market-link" href="/zlevneni/"><strong>Prohlédnout slevy a naskladnění</strong><ArrowUpRight size={18} aria-hidden="true" /></a>
    </section>
    </div>
  );
}
