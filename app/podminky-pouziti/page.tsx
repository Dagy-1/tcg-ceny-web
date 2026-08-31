import type { Metadata } from "next";
import Link from "next/link";
import HeaderActions from "../HeaderActions";

export const metadata: Metadata = {
  title: "Podmínky používání",
  description: "Pravidla používání informační služby TCG Ceny.",
  alternates: {
    canonical: "/podminky-pouziti",
  },
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <nav className="nav" aria-label="Navigace právních informací">
        <Link className="brand" href="/" aria-label="TCG Ceny – domů">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span>TCG <strong>Ceny</strong></span>
        </Link>
        <div className="nav-links"><Link href="/">Zpět na hlavní stránku</Link></div>
        <HeaderActions />
      </nav>

      <header className="legal-hero shell">
        <p className="eyebrow">Právní informace</p>
        <h1>Podmínky používání</h1>
        <p>
          Jasná pravidla pro používání webu a komunitních funkcí TCG Ceny.
          Platnost od 25. 7. 2026.
        </p>
      </header>

      <div className="legal-content shell">
        <aside className="legal-summary">
          <strong>Stručně</strong>
          <p>TCG Ceny je nezávislá informační služba. Nic neprodává a není smluvní stranou nákupu v e-shopu.</p>
          <a href="mailto:podpora@tcgceny.cz">podpora@tcgceny.cz</a>
        </aside>

        <article className="legal-document">
          <section>
            <h2>1. O službě TCG Ceny</h2>
            <p>
              TCG Ceny porovnává veřejně dostupné informace o cenách a skladovosti
              sealed Pokémon TCG produktů a nabízí související komunitní funkce,
              například upozornění, historii cen a orientační přehled portfolia.
              Služba je v současnosti provozována jako bezplatný komunitní projekt
              ve vývoji.
            </p>
          </section>

          <section>
            <h2>2. Ceny, skladovost a odkazy</h2>
            <p>
              Zobrazená data mají informační charakter. Přestože se je snažíme
              kontrolovat a průběžně aktualizovat, mohou být opožděná, neúplná
              nebo chybná. Rozhodující je vždy cena, dostupnost a podmínky uvedené
              přímo na stránce daného obchodu.
            </p>
            <p>
              Kliknutím na nabídku uživatel přechází na web třetí strany. Nákup,
              reklamace, doprava, platba i ochrana spotřebitele se řídí podmínkami
              vybraného obchodu. TCG Ceny není prodejce, tržiště ani prostředník
              uzavírané kupní smlouvy.
            </p>
          </section>

          <section>
            <h2>3. Nezávislost a pořadí nabídek</h2>
            <p>
              Uvedení obchodu neznamená partnerství ani doporučení. Nabídky se
              snažíme řadit objektivně podle dostupných údajů, zejména ceny a
              skladovosti. Případná budoucí obchodní spolupráce musí být zřetelně
              označena a nesmí být vydávána za nezávislé pořadí.
            </p>
          </section>

          <section>
            <h2>4. Historie cen a portfolio</h2>
            <p>
              Grafy, cenové trendy a hodnoty portfolia jsou pouze orientační.
              Nejde o investiční, finanční ani nákupní doporučení a nezaručují
              budoucí hodnotu či možnost prodeje produktu za uvedenou cenu.
            </p>
          </section>

          <section>
            <h2>5. Odpovědné používání</h2>
            <p>
              Uživatel nesmí službu zneužívat, obcházet její ochranné mechanismy,
              automatizovaně ji zatěžovat, narušovat její provoz ani používat její
              obsah způsobem odporujícím právním předpisům nebo právům třetích osob.
              Přístup můžeme při zneužití omezit.
            </p>
          </section>

          <section>
            <h2>6. Dostupnost služby</h2>
            <p>
              Funkce můžeme měnit, dočasně omezit nebo ukončit, zejména kvůli
              údržbě, bezpečnosti, změnám zdrojů dat nebo dalším technickým
              okolnostem. Neposkytujeme záruku nepřetržité dostupnosti.
            </p>
          </section>

          <section>
            <h2>7. Ochranné známky a obsah třetích stran</h2>
            <p>
              TCG Ceny je nezávislý komunitní projekt a není spojen s Nintendo,
              Creatures Inc., GAME FREAK ani The Pokémon Company. Názvy produktů,
              ochranné známky, loga a další obsah třetích stran náleží jejich
              příslušným vlastníkům a slouží pouze k identifikaci porovnávaných
              produktů a obchodů.
            </p>
          </section>

          <section>
            <h2>8. Změny podmínek a kontakt</h2>
            <p>
              Podmínky můžeme přiměřeně aktualizovat podle vývoje služby.
              Aktuální verze bude vždy zveřejněna na této stránce. Dotazy,
              upozornění na chybu nebo žádosti související se službou posílejte
              na <a href="mailto:podpora@tcgceny.cz">podpora@tcgceny.cz</a>.
            </p>
          </section>
        </article>
      </div>

      <footer className="footer legal-footer">
        <div className="shell legal">
          <span>© 2026 TCG Ceny</span>
          <span>
            <Link href="/soukromi-a-cookies">Soukromí a cookies</Link>
            {" · "}
            <Link href="/">Hlavní stránka</Link>
          </span>
        </div>
      </footer>
    </main>
  );
}
