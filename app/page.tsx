import Image from "next/image";
import {
  BadgeDollarSign,
  BellRing,
  BriefcaseBusiness,
  ChartNoAxesCombined,
} from "lucide-react";
import AuthMenu from "./AuthMenu";
import MobileNav from "./MobileNav";
import PriceHistoryDemo from "./PriceHistoryDemo";

const DISCORD_URL = "https://discord.gg/pRC8GKAKxG";

const offers = [
  { shop: "Kitstore", price: "1 799 Kč", best: true },
  { shop: "Tolarie", price: "1 799 Kč", best: true },
  { shop: "Pompo", price: "1 894 Kč" },
  { shop: "Vortexstore", price: "1 990 Kč" },
];

const features = [
  {
    code: "CENY",
    icon: BadgeDollarSign,
    title: "Porovnání cen",
    text: "Na jednom místě vidíš dostupné nabídky českých e-shopů, jejich cenu i stav skladu.",
  },
  {
    code: "ALERTY",
    icon: BellRing,
    title: "Ověřené alerty",
    text: "Upozorníme tě na naskladnění nebo změnu ceny. Výrazné změny nejdříve znovu ověříme.",
  },
  {
    code: "HISTORIE",
    icon: ChartNoAxesCombined,
    title: "Historie cen",
    text: "Sleduj vývoj nejlepší české ceny, minimum, maximum i medián za zvolené období.",
  },
  {
    code: "PORTFOLIO",
    icon: BriefcaseBusiness,
    title: "Portfolio sbírky",
    text: "Ulož nákupní ceny a sleduj orientační hodnotu, zisk nebo ztrátu celé sealed sbírky.",
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
      "Katalog a produktové detaily průběžně načítají aktuální centrální ceny a skladovost. Když je API dočasně nedostupné, web viditelně označí poslední bezpečný snapshot.",
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
          <a href="/katalog">Katalog</a>
          <a href="/porovnani">Porovnání</a>
          <a href="/portfolio">Portfolio</a>
          <a href="/sledovani">Sledování</a>
          <a href="#funkce">Funkce</a>
          <a className="nav-partner" href="/pro-eshopy">Pro e-shopy</a>
        </div>
        <div className="nav-actions">
          <AuthMenu />
          <MobileNav />
        </div>
      </nav>

      <section id="uvod" className="hero shell">
        <div className="hero-copy" data-motion>
          <p className="eyebrow"><span className="live-dot" /> Pokémon TCG na jednom místě</p>
          <h1>
            Chyť nejlepší cenu.
            <span>Nezmeškej naskladnění.</span>
          </h1>
          <p className="hero-lead">
           Automatické hlídání cen a skladovosti Pokémon TCG v ČR. Nezmeškej žádnou slevu ani naskladnění.

          </p>
          <div className="hero-actions">
            <a className="button" href="/katalog/">
              Prohlédnout katalog <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href={DISCORD_URL} target="_blank" rel="noreferrer">Otevřít Discord</a>
          </div>
          <div className="hero-proof" aria-label="Hlavní přednosti">
            <span><b>🛒České</b> e-shopy na jednom místě</span>
            <span><b>📈Historie</b> cen a skladovosti</span>
            <span><b>⚡ Automatické</b> alerty cen a skladovosti</span>
          </div>
        </div>

        <div className="market-card" aria-label="Ukázka porovnání nabídek" data-motion>
          <div className="market-card-top">
            <div>
              <p className="card-kicker">Ukázka porovnání</p>
              <h2>Chaos Rising ETB</h2>
              <p className="product-meta">Mega Evolution Series · ETB</p>
            </div>
            <div className="product-visual">
              <Image
                src="/chaos-rising-etb.png"
                alt="Pokémon TCG Chaos Rising Elite Trainer Box"
                width={1000}
                height={952}
                unoptimized
              />
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
            Aktuální nabídky a ověřenou skladovost najdeš v katalogu i Discord botovi.
          </p>
        </div>
      </section>

      <section className="shop-cloud shell" aria-label="Příklady sledovaných obchodů" data-motion>
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

      <section id="funkce" className="section shell" data-motion>
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
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <article className="feature-card" key={feature.code} data-motion style={{ "--motion-delay": `${Math.min(index, 3) * 55}ms` } as React.CSSProperties}>
                <div className="feature-card-top">
                  <div className="feature-number">0{index + 1}</div>
                  <span className="feature-icon" aria-hidden="true">
                    <Icon size={23} strokeWidth={1.8} />
                  </span>
                </div>
                <div className="feature-card-copy">
                  <span className="feature-code">{feature.code}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="jak-to-funguje" className="section section-dark" data-motion>
        <div className="shell">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Jednoduchý start</p>
              <h2>Od hledání k upozornění ve třech krocích.</h2>
            </div>
          </div>
          <div className="steps">
            <article>
              <span>01</span>
              <h3>Najdi produkt</h3>
              <p>Procházej katalog nebo rychle vyhledej konkrétní produkt.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Porovnej nabídky</h3>
              <p>Zkontroluj ceny, dostupnost a jednotlivé české e-shopy.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Zapni sledování</h3>
              <p>Nastav cenový limit nebo hlídání naskladnění a změnu ti pošleme do soukromé zprávy na Discordu.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section shell insight-section" data-motion>
          <div className="insight-copy">
            <p className="eyebrow">Portfolio v jednom přehledu</p>
            <h2>Sleduj, jak se vyvíjí hodnota tvé sbírky.</h2>
            <p>
              Každý produkt má vlastní tržní vývoj. TCG Ceny je spojí do jednoho
              přehledu a ukáže orientační hodnotu celého portfolia v čase.
            </p>
            <ul className="check-list">
              <li>Vývoj hodnoty za 7, 30 nebo 90 dní</li>
              <li>Investovaná částka a aktuální tržní hodnota</li>
              <li>Celkový zisk nebo ztráta portfolia</li>
            </ul>
          </div>
        <PriceHistoryDemo />
      </section>

      <section id="spolehlivost" className="section shell reliability" data-motion>
        <div className="reliability-panel">
          <div>
            <p className="eyebrow">Jak hlídáme kvalitu dat</p>
            <h2>Ověřená změna. Jasný zdroj. Férové pořadí.</h2>
          </div>
          <div className="reliability-grid">
            <article>
              <span className="reliability-index">01</span>
              <strong>Opakované ověření</strong>
              <p>Výraznou změnu ceny nebo naskladnění před odesláním upozornění zkontrolujeme znovu.</p>
            </article>
            <article>
              <span className="reliability-index">02</span>
              <strong>Dohledatelný zdroj</strong>
              <p>U nabídky vidíš e-shop, přímý odkaz a čas poslední kontroly.</p>
            </article>
            <article>
              <span className="reliability-index">03</span>
              <strong>Nezávislé pořadí</strong>
              <p>Nabídky řadíme podle ceny a dostupnosti, ne podle placené spolupráce.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="partner-teaser shell" data-motion>
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

      <section className="section shell faq-section" data-motion>
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

      <section className="cta-section shell" data-motion>
        <div>
          <p className="eyebrow">TCG Ceny · veřejná beta</p>
          <h2>
            Začni sledovat český
            <br />
            Pokémon TCG trh.
          </h2>
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
            <a className="footer-contact" href="mailto:podpora@tcgceny.cz">podpora@tcgceny.cz</a>
          </div>
          <div className="footer-links">
            <a href={DISCORD_URL} target="_blank" rel="noreferrer">Discord</a>
            <a href="/podminky-pouziti">Podmínky používání</a>
            <a href="/soukromi-a-cookies">Soukromí a cookies</a>
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
