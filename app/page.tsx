import Image from "next/image";
import {
  BadgeDollarSign,
  BellRing,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ExternalLink,
  ShieldCheck,
  Store,
} from "lucide-react";
import AuthMenu from "./AuthMenu";
import CardCompanion from "./CardCompanion";
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
    icon: BadgeDollarSign,
    title: "Porovnání cen",
    text: "Dostupné nabídky českých e-shopů na jednom místě.",
  },
  {
    icon: BellRing,
    title: "Upozornění",
    text: "Cena a skladovost podle tvého nastavení.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Historie cen",
    text: "Vývoj trhu bez vlastních tabulek.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Portfolio",
    text: "Hodnota sbírky v jednom přehledu.",
  },
];

const heroProof = [
  { icon: Store, label: "České e-shopy" },
  { icon: ShieldCheck, label: "Ověřené změny" },
  { icon: BellRing, label: "Upozornění zdarma" },
];

const monitoredShops = [
  { name: "Alza", mark: "A", url: "https://www.alza.cz/" },
  { name: "Bulbazard", mark: "B", url: "https://www.bulbazard.cz/" },
  { name: "Geek Hall", mark: "GH", url: "https://geekhall.cz/" },
  { name: "Kitstore", mark: "K", url: "https://www.kitstore.cz/" },
  { name: "Knihy Dobrovský", mark: "KD", url: "https://www.knihydobrovsky.cz/" },
  { name: "Najáda", mark: "N", url: "https://www.najada.games/" },
  { name: "Pikastore", mark: "P", url: "https://pikastore.cz/" },
  { name: "Pokešov", mark: "PŠ", url: "https://www.pokesov.cz/" },
  { name: "Pompo", mark: "P", url: "https://pompo.cz/" },
  { name: "Shadowball", mark: "S", url: "https://www.shadowball.cz/" },
  { name: "Smarty", mark: "S", url: "https://www.smarty.cz/" },
  { name: "Sparkys", mark: "S", url: "https://www.sparkys.cz/" },
  { name: "TLAMA games", mark: "TG", url: "https://www.tlamagames.com/" },
  { name: "Tolarie", mark: "T", url: "https://www.tolarie.cz/" },
  { name: "Veselý Drak", mark: "VD", url: "https://www.vesely-drak.cz/" },
  { name: "Vortexstore", mark: "V", url: "https://www.vortexstore.eu/" },
] as const;

const faqs = [
  {
    question: "Je používání TCG Ceny zdarma?",
    answer:
      "Ano. Katalog, porovnání, portfolio i základní funkce Discord bota jsou během veřejné bety dostupné zdarma.",
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
    <main className="home-page">
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
          <a href="/zlevneni">Zlevnění</a>
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
            Neplať víc.
            <span>Nezmeškej naskladnění.</span>
          </h1>
          <p className="hero-lead">
            Porovnáváme ověřené nabídky českých e-shopů a pomůžeme ti sledovat
            změny cen i skladovosti.
          </p>
          <div className="hero-actions">
            <a className="button" href="/katalog/">
              Prohlédnout katalog <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#jak-to-funguje">Jak to funguje</a>
          </div>
          <div className="hero-proof" aria-label="Hlavní přednosti">
            {heroProof.map(({ icon: Icon, label }) => (
              <span key={label}>
                <Icon size={15} strokeWidth={1.9} aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <CardCompanion />

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

      <section className="market-proof shell" aria-label="Příklady sledovaných obchodů" data-motion>
        <div className="market-proof-copy">
          <p className="eyebrow">Český trh v jednom přehledu</p>
          <strong>Porovnáváme veřejné nabídky napříč e-shopy.</strong>
        </div>
        <div className="shop-marquee" aria-label="Sledované české e-shopy">
          <div className="shop-marquee-track">
            {[false, true].map((isDuplicate) => (
              <div
                className="shop-tags"
                aria-hidden={isDuplicate ? "true" : undefined}
                key={isDuplicate ? "duplicate" : "primary"}
              >
                {monitoredShops.map((shop) => (
                  <a
                    className="shop-link"
                    href={shop.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={isDuplicate ? -1 : undefined}
                    aria-label={`Otevřít e-shop ${shop.name} v nové kartě`}
                    key={shop.name}
                  >
                    <span className="shop-mark" aria-hidden="true">{shop.mark}</span>
                    <span className="shop-name">{shop.name}</span>
                    <ExternalLink className="shop-link-icon" size={13} strokeWidth={1.8} aria-hidden="true" />
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="shop-disclaimer">Pořadí není placené · odkazy vedou přímo na e-shopy.</p>
      </section>

      <section id="funkce" className="section shell" data-motion>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Vše důležité na jednom místě</p>
            <h2>Všechno pro chytřejší nákup.</h2>
          </div>
          <p>Porovnej nabídky, sleduj změny a měj přehled o své sbírce.</p>
        </div>
        <div className="feature-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <article className="feature-card" key={feature.title} data-motion style={{ "--motion-delay": `${Math.min(index, 3) * 55}ms` } as React.CSSProperties}>
                <div className="feature-card-top">
                  <div className="feature-number">0{index + 1}</div>
                  <span className="feature-icon" aria-hidden="true">
                    <Icon size={23} strokeWidth={1.8} />
                  </span>
                </div>
                <div className="feature-card-copy">
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
              <h2>Najdi produkt. Porovnej. Nastav sledování.</h2>
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
              <h3>Nastav sledování</h3>
              <p>Ulož si cenový limit nebo hlídání naskladnění přehledně na jednom místě.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section shell insight-section" data-motion>
          <div className="insight-copy">
            <p className="eyebrow">Portfolio v jednom přehledu</p>
            <h2>Sleduj hodnotu své sbírky.</h2>
            <p>
              Nákupy, aktuální hodnota a vývoj portfolia v jednom přehledu.
            </p>
            <ul className="check-list">
              <li>Vývoj hodnoty za 7, 30 nebo 90 dní</li>
              <li>Investice, aktuální hodnota a celkový výsledek</li>
            </ul>
          </div>
        <PriceHistoryDemo />
      </section>

      <section id="spolehlivost" className="section shell reliability" data-motion>
        <div className="reliability-panel">
          <div>
            <p className="eyebrow">Transparentní data</p>
            <h2>Data, kterým rozumíš.</h2>
          </div>
          <div className="reliability-grid">
            <article>
              <span className="reliability-index">01</span>
              <strong>Dvojí kontrola</strong>
              <p>Výrazné změny ceny a skladovosti ověřujeme znovu.</p>
            </article>
            <article>
              <span className="reliability-index">02</span>
              <strong>Dohledatelný zdroj</strong>
              <p>U nabídky vidíš obchod, odkaz i čas kontroly.</p>
            </article>
            <article>
              <span className="reliability-index">03</span>
              <strong>Férové pořadí</strong>
              <p>Rozhoduje dostupnost a cena, ne placená spolupráce.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="partner-teaser shell" data-motion>
        <div>
          <p className="eyebrow">Pro e-shopy</p>
          <h2>Dostaňte nabídku přímo ke sběratelům.</h2>
          <p>Zjistěte, jak nabídky zobrazujeme a ověřujeme.</p>
        </div>
        <a className="button button-secondary" href="/pro-eshopy">
          Informace pro e-shopy <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="section shell faq-section" data-motion>
        <div className="faq-heading">
          <p className="eyebrow">Stručně a jasně</p>
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
          <h2>Začni hlídat ceny zdarma.</h2>
          <p>Prohlédni katalog, porovnej nabídky a přidej si produkty do Sledování.</p>
        </div>
        <div className="cta-actions">
          <a className="button" href="/katalog/">
            Otevřít katalog <span aria-hidden="true">→</span>
          </a>
          <a className="text-link" href={DISCORD_URL} target="_blank" rel="noreferrer">Discord</a>
        </div>
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
