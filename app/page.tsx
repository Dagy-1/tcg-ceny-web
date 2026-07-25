const DISCORD_URL = "https://discord.gg/pRC8GKAKxG";

const offers = [
  { shop: "Kitstore", price: "1 799 Kč", best: true },
  { shop: "Tolarie", price: "1 799 Kč", best: true },
  { shop: "Pompo", price: "1 894 Kč" },
  { shop: "Vortexstore", price: "1 990 Kč" },
];

const features = [
  {
    code: "PRICE",
    title: "Ceny napříč obchody",
    text: "Jedna nabídka nestačí. U produktu vidíš dostupné české obchody, jejich cenu i stav skladu.",
  },
  {
    code: "STOCK",
    title: "Alerty bez šumu",
    text: "Naskladnění a cenovou změnu nejdříve ověříme. Upozornění pak dorazí přímo do Discordu.",
  },
  {
    code: "HISTORY",
    title: "Historie cen",
    text: "Graf ukáže minimum, maximum, medián i vývoj nejlepší české ceny za zvolené období.",
  },
  {
    code: "PORTFOLIO",
    title: "Portfolio sbírky",
    text: "Ulož nákupní cenu a sleduj orientační hodnotu, zisk nebo ztrátu celé sealed sbírky.",
  },
];

const monitoredShops = [
  "Alza",
  "Geekhall",
  "Kitstore",
  "Najáda",
  "Pompo",
  "Sparkys",
  "Tolarie",
  "Veselý Drak",
  "Vortexstore",
];

const faqs = [
  {
    question: "Je používání TCG Ceny zdarma?",
    answer:
      "Ano. TCG Ceny je nyní ve veřejné beta verzi a základní funkce Discord bota jsou dostupné zdarma.",
  },
  {
    question: "Jsou ceny na webu živé?",
    answer:
      "Tato stránka představuje funkce služby. Aktuální porovnání, skladovost a alerty jsou dostupné přímo v Discord botovi.",
  },
  {
    question: "Podle čeho řadíte nabídky?",
    answer:
      "Podle dostupnosti a ceny. Pořadí není placené a názvy obchodů na stránce neznamenají obchodní partnerství.",
  },
];

export default function Home() {
  return (
    <main>
      <nav className="nav" aria-label="Hlavní navigace">
        <a className="brand" href="#uvod" aria-label="TCG Ceny – úvod">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span>TCG <strong>Ceny</strong></span>
        </a>
        <div className="nav-links">
          <a href="#funkce">Funkce</a>
          <a href="#jak-to-funguje">Jak to funguje</a>
          <a href="#spolehlivost">Spolehlivost</a>
          <a className="nav-partner" href="/pro-eshopy">Pro e-shopy</a>
        </div>
        <a className="button button-small" href={DISCORD_URL} target="_blank" rel="noreferrer">
          Discord <span aria-hidden="true">→</span>
        </a>
      </nav>

      <section id="uvod" className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> Český Pokémon TCG market monitor</p>
          <h1>
            Chyť nejlepší cenu.
            <span>Nezmeškej naskladnění.</span>
          </h1>
          <p className="hero-lead">
           Automatické hlídání cen a skladovosti Pokémon TCG v ČR. Nezmeškej žádnou slevu ani naskladnění.

          </p>
          <div className="hero-actions">
            <a className="button" href={DISCORD_URL} target="_blank" rel="noreferrer">
              Otevřít Discord <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#jak-to-funguje">Jak služba funguje ↓</a>
          </div>
          <div className="hero-proof" aria-label="Hlavní přednosti">
            <span><b>🛒České</b> e-shopy na jednom místě</span>
            <span><b>📈Historie</b> cen a skladovosti</span>
            <span><b>⚡24/7</b> automatické alerty</span>
          </div>
        </div>

        <div className="market-card" aria-label="Ukázka porovnání nabídek">
          <div className="market-card-top">
            <div>
              <p className="card-kicker">Ukázka porovnání</p>
              <h2>Chaos Rising ETB</h2>
              <p className="product-meta">Mega Evolution Series · ETB</p>
            </div>
            <div className="product-visual">
              <div className="product-placeholder" aria-label="Neutrální zástupný obrázek produktu">
                <span className="placeholder-card placeholder-card-back" />
                <span className="placeholder-card placeholder-card-front">
                  <i />
                  <b>ETB</b>
                  <small>SEALED PRODUCT</small>
                </span>
              </div>
            </div>
          </div>
          <div className="best-price">
            <span className="status-dot" />
            <div>
              <small>Nejlepší dostupná cena</small>
              <strong>1 799 Kč</strong>
            </div>
            <span className="verified">Ověřeno</span>
          </div>
          <div className="offer-list">
            {offers.map((offer) => (
              <div className={offer.best ? "offer offer-best" : "offer"} key={offer.shop}>
                <span>{offer.shop}</span>
                <span className="stock">Skladem</span>
                <strong>{offer.price}</strong>
              </div>
            ))}
          </div>
          <div className="card-footer">
            <span><i className="pulse" /> Naskladnění zachyceno</span>
            <span>Ukázkové zobrazení</span>
          </div>
          <p className="demo-note">
            Aktuální nabídky a ověřenou skladovost najdeš přímo v Discord botovi.
          </p>
        </div>
      </section>

      <section className="shop-cloud shell" aria-label="Příklady sledovaných obchodů">
        <div className="shop-cloud-copy">
          <p className="eyebrow">Široký pohled na český trh</p>
          <h2>Nehledáme jednu cenu. Porovnáváme celý výběr.</h2>
          <p>
            TCG Ceny sleduje veřejně dostupné nabídky českých e-shopů. Názvy
            uvádíme transparentně, aby bylo vždy jasné, odkud nabídka pochází.
          </p>
        </div>
        <div className="shop-tags">
          {monitoredShops.map((shop) => (
            <span key={shop}>{shop}</span>
          ))}
          <span className="shop-more">a další</span>
        </div>
        <p className="shop-disclaimer">
          Uvedení obchodu neznamená obchodní partnerství ani doporučení.
        </p>
      </section>

      <section id="funkce" className="section shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Vše důležité na jednom místě</p>
            <h2>Trh pod kontrolou. Bez desítek otevřených záložek.</h2>
          </div>
          <p>
            Od rychlého porovnání až po dlouhodobý přehled sbírky.
            TCG Ceny spojuje data, která sběratel skutečně potřebuje.
          </p>
        </div>
        <div className="feature-grid">
          {features.map((feature, index) => (
            <article className="feature-card" key={feature.code}>
              <div className="feature-number">0{index + 1}</div>
              <span className="feature-code">{feature.code}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="jak-to-funguje" className="section section-dark">
        <div className="shell">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Jednoduchý start</p>
              <h2>Tři kroky k lepšímu nákupu</h2>
            </div>
          </div>
          <div className="steps">
            <article>
              <span>01</span>
              <h3>Najdi produkt</h3>
              <p>Procházej katalog podle edice a typu nebo použij rychlé vyhledávání.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Porovnej nabídky</h3>
              <p>Na jednom místě uvidíš dostupné obchody, ceny a aktuální skladovost.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Zapni sledování</h3>
              <p>Nastav naskladnění nebo cenový limit a potvrzenou změnu dostaneš do DM.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section shell insight-section">
        <div className="insight-copy">
          <p className="eyebrow">Cena není jen jedno číslo</p>
          <h2>Sleduj dostupnost i směr trhu.</h2>
          <p>
            Po vydání nebo dotisku může cena klesnout. Jakmile nabídky mizí,
            sealed produkt může naopak zdražovat. Historie ti ukáže celý vývoj,
            ne pouze dnešní cenovku.
          </p>
          <ul className="check-list">
            <li>Rozlišení krátké slevy od dlouhodobého trendu</li>
            <li>Přehled, kdy nabídky přibývají nebo mizí</li>
            <li>Vývoj orientační hodnoty sealed portfolia</li>
          </ul>
        </div>
        <div className="chart-panel" aria-label="Ukázka historie ceny">
          <div className="chart-head">
            <div>
              <small>Ukázka historie nejlepší ceny</small>
              <strong>Vývoj sealed produktu v čase</strong>
            </div>
            <span>90 dní</span>
          </div>
          <div className="chart-value">
            <strong>2 690 Kč</strong>
            <span>růst i pokles v jednom přehledu</span>
          </div>
          <div className="chart">
            <div className="grid-lines" />
            <div className="chart-line">
              <i /><i /><i /><i /><i /><i /><i /><i />
            </div>
          </div>
          <div className="chart-labels"><span>20. 6.</span><span>7. 7.</span><span>Dnes</span></div>
          <p className="chart-context">
            Ilustrační graf funkce. Konkrétní vývoj se liší podle produktu,
            dotisků a dostupnosti.
          </p>
        </div>
      </section>

      <section id="spolehlivost" className="section shell reliability">
        <div className="reliability-panel">
          <div>
            <p className="eyebrow">Data, kterým můžeš věřit</p>
            <h2>Přesnější alerty. Nezávislé porovnání.</h2>
          </div>
          <div className="reliability-grid">
            <article>
              <span className="reliability-index">01</span>
              <strong>Ověřené změny</strong>
              <p>Podezřelou změnu před odesláním upozornění znovu ověříme.</p>
            </article>
            <article>
              <span className="reliability-index">02</span>
              <strong>Aktuální srovnání</strong>
              <p>Na jednom místě porovnáváme cenu i dostupnost napříč českými obchody.</p>
            </article>
            <article>
              <span className="reliability-index">03</span>
              <strong>Objektivní pořadí</strong>
              <p>Nabídky řadíme podle ceny a dostupnosti, ne podle obchodní spolupráce.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="partner-teaser shell">
        <div>
          <p className="eyebrow">Pro e-shopy a datové partnery</p>
          <h2>Vaše nabídka může vést přímo k zákazníkovi.</h2>
          <p>
            Připravili jsme samostatné informace o zobrazování nabídek,
            ověřování dat, férovém řazení a možnostech spolupráce.
          </p>
        </div>
        <a className="button button-secondary" href="/pro-eshopy">
          Informace pro e-shopy <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="section shell faq-section">
        <div className="faq-heading">
          <p className="eyebrow">Stručně a transparentně</p>
          <h2>Nejčastější otázky</h2>
        </div>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.question}>
              <summary>{item.question}<span aria-hidden="true">+</span></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cta-section shell">
        <div>
          <p className="eyebrow">TCG Ceny · veřejná beta</p>
          <h2>Začni sledovat český Pokémon TCG trh.</h2>
          <p>Připoj se zdarma, vyzkoušej bota a pomoz nám doladit službu pro české sběratele.</p>
        </div>
        <a className="button" href={DISCORD_URL} target="_blank" rel="noreferrer">
          Přidat se na Discord <span aria-hidden="true">→</span>
        </a>
      </section>

      <footer className="footer">
        <div className="shell footer-grid">
          <div>
            <a className="brand" href="#uvod">
              <span className="brand-mark small" aria-hidden="true"><span /><span /></span>
              <span>TCG <strong>Ceny</strong></span>
            </a>
            <p>České porovnání cen, skladovosti a historie sealed Pokémon TCG produktů.</p>
          </div>
          <div className="footer-links">
            <a href={DISCORD_URL} target="_blank" rel="noreferrer">Discord</a>
            <a href="mailto:podpora@tcgceny.cz">podpora@tcgceny.cz</a>
            <a href="#funkce">Funkce</a>
            <a href="/pro-eshopy">Pro e-shopy</a>
          </div>
        </div>
        <div className="shell legal">
          <span>© 2026 TCG Ceny</span>
          <span>Nezávislý komunitní projekt. Není spojen s Nintendo, Creatures Inc., GAME FREAK ani The Pokémon Company.</span>
        </div>
      </footer>
    </main>
  );
}
