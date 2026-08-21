import type { Metadata } from "next";
import Link from "next/link";
import AuthMenu from "../AuthMenu";
import MobileNav from "../MobileNav";

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

const principles = [
  {
    title: "Návštěvník přímo u produktu",
    text: "Zákazník u nabídky vidí váš obchod a jedním kliknutím přejde na konkrétní produkt. Objednávku dokončí přímo u vás.",
  },
  {
    title: "Jasné a férové srovnání",
    text: "Zobrazíme cenu, dostupnost a správnou variantu vedle ostatních nabídek. Bez provize a bez placeného zvýhodnění.",
  },
  {
    title: "Aktuální cena a skladovost",
    text: "Údaje pravidelně kontrolujeme, aby zákazník věděl, zda může produkt právě teď koupit ve vašem e-shopu.",
  },
  {
    title: "Opravy v našem katalogu",
    text: "Pokud u nabídky nesedí cena, dostupnost, varianta nebo odkaz, konkrétní údaj v TCG Ceny prověříme a opravíme.",
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
        <Link className="brand" href="/" aria-label="TCG Ceny – domů">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span>TCG <strong>Ceny</strong></span>
        </Link>
        <div className="nav-links">
          <Link href="/katalog/">Katalog</Link>
          <Link href="/zlevneni/">Zlevnění</Link>
          <Link href="/porovnani/">Porovnání</Link>
          <Link href="/portfolio/">Portfolio</Link>
          <Link href="/sledovani/">Sledování</Link>
          <Link href="/pro-eshopy/" aria-current="page">Pro e-shopy</Link>
        </div>
        <div className="nav-actions">
          <AuthMenu />
          <MobileNav />
        </div>
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
              Zařadit e-shop <span aria-hidden="true">→</span>
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

      <section id="prinos" className="section section-dark">
        <div id="principy" className="shell">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Co nabízíme</p>
              <h2>Co váš e-shop získá.</h2>
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
            <Link className="brand" href="/">
              <span className="brand-mark small" aria-hidden="true"><span /><span /></span>
              <span>TCG <strong>Ceny</strong></span>
            </Link>
            <p>České porovnání cen, skladovosti a historie sealed Pokémon TCG produktů.</p>
          </div>
          <div className="footer-links">
            <Link href="/">Hlavní stránka</Link>
            <a href={CONTACT_URL}>Kontakt</a>
            <Link href="/podminky-pouziti">Podmínky používání</Link>
            <Link href="/soukromi-a-cookies">Soukromí a cookies</Link>
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
