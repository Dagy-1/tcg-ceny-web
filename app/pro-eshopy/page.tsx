import type { Metadata } from "next";

const CONTACT_URL =
  "mailto:podpora@tcgceny.cz?subject=Spolupráce%20s%20TCG%20Ceny&body=Dobrý%20den%2C%0A%0Ajmenuji%20se%20...%20a%20zastupuji%20e-shop%20...%0A%0ARádi%20bychom%20s%20vámi%20probrali%20...%0A";

export const metadata: Metadata = {
  title: "Pro e-shopy a partnery",
  description:
    "Informace pro české Pokémon TCG e-shopy: transparentní zobrazení nabídek, přímé odkazy na produkty a kontakt pro ověření dat.",
  alternates: {
    canonical: "/pro-eshopy",
  },
};

const benefits = [
  {
    number: "01",
    title: "Přímý přechod do e-shopu",
    text: "U nabídky je jasně uvedený zdroj. Zákazník pokračuje přímo na konkrétní produkt ve vašem obchodě.",
  },
  {
    number: "02",
    title: "Správná varianta produktu",
    text: "Rozlišujeme edice, typy balení i varianty. Nepřesné přiřazení s vámi rychle prověříme a opravíme.",
  },
  {
    number: "03",
    title: "Férové pořadí nabídek",
    text: "Pořadí vychází z dostupnosti a ceny. Obchodní spolupráce nemění pozici produktu ve srovnání.",
  },
];

const principles = [
  {
    title: "Transparentní zdroj",
    text: "Uživatel vždy vidí název obchodu, cenu, stav dostupnosti a odkaz na zdrojovou stránku.",
  },
  {
    title: "Šetrná kontrola",
    text: "Každý obchod má vlastní bezpečné tempo kontrol. Při omezení webu systém automaticky zpomalí.",
  },
  {
    title: "Ověřené změny",
    text: "Podezřelé naskladnění nebo výraznou změnu ceny před veřejným upozorněním ověřujeme opakovaně.",
  },
  {
    title: "Rychlá oprava",
    text: "Chybnou cenu, skladovost, variantu nebo odkaz řešíme podle konkrétní produktové stránky.",
  },
];

const onboarding = [
  {
    number: "1",
    title: "Napište nám",
    text: "Stačí název e-shopu, kontaktní osoba a odkaz na váš Pokémon TCG sortiment.",
  },
  {
    number: "2",
    title: "Ověříme data",
    text: "Společně zkontrolujeme názvy produktů, varianty, dostupnost a způsob odkazování.",
  },
  {
    number: "3",
    title: "Zůstaneme v kontaktu",
    text: "Pro opravy a nové produktové řady budete mít přímý kontakt na TCG Ceny.",
  },
];

const faqs = [
  {
    question: "Je zařazení obchodu placené?",
    answer:
      "Ne. Nabídky řadíme podle dostupnosti a ceny. Případná budoucí obchodní spolupráce nebude měnit přirozené pořadí nabídek.",
  },
  {
    question: "Prodává TCG Ceny produkty?",
    answer:
      "Ne. TCG Ceny není prodejce ani tržiště. Uživatel přechází na produktovou stránku konkrétního e-shopu a nákup dokončuje přímo u něj.",
  },
  {
    question: "Jak nahlásíme chybnou cenu nebo produkt?",
    answer:
      "Napište na podpora@tcgceny.cz a přiložte odkaz. Konkrétní přiřazení, cenu nebo skladovost prověříme.",
  },
];

export default function ForShops() {
  return (
    <main className="shop-page">
      <nav className="nav" aria-label="Navigace stránky pro e-shopy">
        <a className="brand" href="/" aria-label="TCG Ceny – domů">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span>TCG <strong>Ceny</strong></span>
        </a>
        <div className="nav-links">
          <a href="#prinos">Přínos</a>
          <a href="#principy">Principy</a>
          <a href="#spoluprace">Spolupráce</a>
          <a href="/">Pro sběratele</a>
        </div>
        <a className="button button-small" href={CONTACT_URL}>
          Kontakt
        </a>
      </nav>

      <section className="shop-page-hero shell">
        <div>
          <p className="eyebrow">TCG Ceny pro e-shopy a partnery</p>
          <h1>
            Vaše nabídka.
            <span>Přímá cesta k zákazníkovi.</span>
          </h1>
          <p className="hero-lead">
            Budujeme nezávislý český přehled cen a skladovosti sealed Pokémon
            TCG produktů. Každá nabídka má jasný zdroj a odkazuje přímo na
            konkrétní produkt v e-shopu.
          </p>
          <div className="hero-actions">
            <a className="button" href={CONTACT_URL}>
              Probrat spolupráci <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#jak-fungujeme">Jak pracujeme s nabídkami</a>
          </div>
          <div className="partner-hero-notes" aria-label="Základní informace">
            <span>Bez provize z objednávky</span>
            <span>Bez placeného pořadí</span>
            <span>Přímý odkaz na zdroj</span>
          </div>
        </div>

        <div className="shop-page-summary" aria-label="Cesta zákazníka">
          <p className="card-kicker">Cesta zákazníka</p>
          <h2>Od porovnání přímo k produktu</h2>
          <div className="summary-flow">
            <article>
              <span>1</span>
              <div><strong>Uživatel hledá produkt</strong><small>katalog, vyhledávání nebo alert</small></div>
            </article>
            <i aria-hidden="true">↓</i>
            <article>
              <span>2</span>
              <div><strong>Porovná dostupné nabídky</strong><small>cena, skladovost a zdroj</small></div>
            </article>
            <i aria-hidden="true">↓</i>
            <article>
              <span>3</span>
              <div><strong>Otevře váš e-shop</strong><small>přímý odkaz na konkrétní produkt</small></div>
            </article>
          </div>
          <p className="summary-note">
            TCG Ceny není tržiště. Objednávka i zákaznický vztah zůstávají ve vašem e-shopu.
          </p>
        </div>
      </section>

      <section id="prinos" className="partner-proof">
        <div className="shell partner-proof-grid">
          <div>
            <span className="proof-label">Zdroj návštěvy</span>
            <strong>Konkrétní produkt</strong>
          </div>
          <div>
            <span className="proof-label">Řazení</span>
            <strong>Cena a dostupnost</strong>
          </div>
          <div>
            <span className="proof-label">Kontakt</span>
            <strong>Česká ruční podpora</strong>
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Co spolupráce přináší</p>
            <h2>Srozumitelná prezentace bez prostředníka.</h2>
          </div>
          <p>
            Neprodáváme za vás. Pomáháme zákazníkovi najít správnou nabídku
            a pokračovat tam, kde může skutečně nakoupit.
          </p>
        </div>
        <div className="partner-benefits">
          {benefits.map((benefit) => (
            <article key={benefit.number}>
              <span>{benefit.number}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="principy" className="section section-dark">
        <div className="shell">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Jak pracujeme</p>
              <h2>Transparentně vůči obchodům i zákazníkům.</h2>
            </div>
          </div>
          <div className="partner-principles">
            {principles.map((principle, index) => (
              <article key={principle.title}>
                <span>0{index + 1}</span>
                <h3>{principle.title}</h3>
                <p>{principle.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="jak-fungujeme" className="section shell data-standard">
        <div className="data-standard-copy">
          <p className="eyebrow">Co u nabídky zobrazujeme</p>
          <h2>Jen informace, které pomáhají rozhodnout.</h2>
          <p>
            Z veřejné produktové stránky používáme údaje nutné pro porovnání.
            Uživatel vždy ví, odkud nabídka pochází.
          </p>
          <ul className="check-list">
            <li>Název obchodu a konkrétního produktu</li>
            <li>Aktuální cena a stav online dostupnosti</li>
            <li>Přímý odkaz na zdrojovou produktovou stránku</li>
            <li>Čas poslední bezpečné aktualizace</li>
          </ul>
        </div>
        <div className="offer-preview" aria-label="Ukázka zobrazení nabídky">
          <p className="card-kicker">Ukázka nabídky</p>
          <div className="offer-preview-product">
            <span className="offer-preview-icon" aria-hidden="true">TCG</span>
            <div>
              <strong>Sealed produkt</strong>
              <small>Edice · typ produktu</small>
            </div>
          </div>
          <div className="offer-preview-row offer-preview-best">
            <div><strong>Váš e-shop</strong><small>Skladem online</small></div>
            <strong>1 799 Kč</strong>
          </div>
          <div className="offer-preview-row">
            <div><strong>Další nabídka</strong><small>Skladem online</small></div>
            <strong>1 899 Kč</strong>
          </div>
          <div className="offer-preview-link">Otevřít nabídku v e-shopu <span>→</span></div>
          <p>Ilustrační zobrazení. Skutečné pořadí vychází z aktuální ceny a dostupnosti.</p>
        </div>
      </section>

      <section id="spoluprace" className="section section-dark">
        <div className="shell">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Jednoduchý začátek</p>
              <h2>Spolupráci nastavíme ve třech krocích.</h2>
            </div>
          </div>
          <div className="partner-onboarding">
            {onboarding.map((step) => (
              <article key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell partner-faq">
        <div>
          <p className="eyebrow">Časté otázky</p>
          <h2>Stručně a otevřeně.</h2>
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

      <section className="section shell shop-contact">
        <div>
          <p className="eyebrow">Kontakt pro e-shopy a partnery</p>
          <h2>Pojďme ověřit vaše produkty a odkazy.</h2>
          <p>
            Napište nám název obchodu, odkaz na sortiment a kontakt na osobu,
            se kterou můžeme řešit produktová data. Ozveme se konkrétně k vašemu e-shopu.
          </p>
        </div>
        <div className="contact-card">
          <small>Kontaktní e-mail</small>
          <strong>podpora@tcgceny.cz</strong>
          <p>Komunikaci vyřizujeme ručně v češtině.</p>
          <a className="button" href={CONTACT_URL}>Napsat TCG Ceny</a>
        </div>
      </section>

      <footer className="footer">
        <div className="shell footer-grid">
          <div>
            <a className="brand" href="/">
              <span className="brand-mark small" aria-hidden="true"><span /><span /></span>
              <span>TCG <strong>Ceny</strong></span>
            </a>
            <p>České porovnání cen, skladovosti a historie sealed Pokémon TCG produktů.</p>
          </div>
          <div className="footer-links">
            <a href="/">Hlavní stránka</a>
            <a href={CONTACT_URL}>Kontakt</a>
          </div>
        </div>
        <div className="shell legal">
          <span>© 2026 TCG Ceny</span>
          <span>Nezávislý komunitní projekt. Uvedení obchodu neznamená obchodní partnerství.</span>
        </div>
      </footer>
    </main>
  );
}
