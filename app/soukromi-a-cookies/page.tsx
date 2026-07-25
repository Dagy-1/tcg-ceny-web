import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Soukromí a cookies",
  description: "Informace o zpracování osobních údajů a používání cookies službou TCG Ceny.",
  alternates: {
    canonical: "/soukromi-a-cookies",
  },
};

export default function PrivacyPage() {
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
        <Link className="button button-small" href="/">Zpět na hlavní stránku</Link>
      </nav>

      <header className="legal-hero shell">
        <p className="eyebrow">Ochrana soukromí</p>
        <h1>Soukromí a cookies</h1>
        <p>
          Přehledně vysvětlujeme, jaké údaje může web zpracovat a proč.
          Platnost od 25. 7. 2026.
        </p>
      </header>

      <div className="legal-content shell">
        <aside className="legal-summary privacy">
          <strong>Současný stav</strong>
          <p>Web nepoužívá reklamní ani analytické cookies a neobsahuje registraci uživatelů.</p>
          <a href="mailto:podpora@tcgceny.cz">podpora@tcgceny.cz</a>
        </aside>

        <article className="legal-document">
          <section>
            <h2>1. Kdo údaje zpracovává</h2>
            <p>
              Správcem údajů souvisejících s webem tcgceny.cz a komunitním
              projektem TCG Ceny je provozovatel projektu TCG Ceny. Pro dotazy
              nebo uplatnění práv použijte e-mail{" "}
              <a href="mailto:podpora@tcgceny.cz">podpora@tcgceny.cz</a>.
            </p>
          </section>

          <section>
            <h2>2. Jaké údaje můžeme zpracovat</h2>
            <ul>
              <li>
                <strong>Komunikace:</strong> e-mailová adresa, jméno a obsah
                zprávy, pokud nás sami kontaktujete.
              </li>
              <li>
                <strong>Technické provozní údaje:</strong> IP adresa, datum a čas
                požadavku, navštívená adresa, typ prohlížeče a bezpečnostní
                záznamy, pokud je zaznamenává poskytovatel hostingu nebo server.
              </li>
              <li>
                <strong>Discord:</strong> údaje zpracovávané při používání našeho
                Discord serveru či bota se řídí také nastavením a podmínkami
                platformy Discord.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Účely a právní důvody</h2>
            <p>
              Údaje používáme pouze pro odpověď na dotaz, vyřízení požadavku,
              zabezpečení a technický provoz služby, prevenci zneužití a řešení
              chyb. Zpracování je založeno na vyřízení vaší žádosti a na našem
              oprávněném zájmu na bezpečném a spolehlivém provozu služby.
            </p>
          </section>

          <section>
            <h2>4. Příjemci a poskytovatelé</h2>
            <p>
              Technické údaje mohou v nezbytném rozsahu zpracovávat poskytovatelé
              hostingu, domény, e-mailu a bezpečnostní infrastruktury. Údaje
              neprodáváme. K předání dalším osobám dochází jen tehdy, je-li to
              nutné pro provoz služby nebo vyžadováno právním předpisem.
            </p>
          </section>

          <section>
            <h2>5. Doba uchování</h2>
            <p>
              E-mailovou komunikaci uchováváme po dobu potřebnou k vyřízení a
              následné ochraně oprávněných zájmů. Technické logy uchovává
              provozovatel infrastruktury po omezenou dobu potřebnou pro
              zabezpečení a diagnostiku. Nepotřebné údaje průběžně mažeme nebo
              anonymizujeme.
            </p>
          </section>

          <section>
            <h2>6. Cookies</h2>
            <p>
              V současné verzi webu nepoužíváme reklamní, personalizační ani
              analytické cookies. Mohou být použity pouze technicky nezbytné
              mechanismy zajišťující bezpečné doručení webu. Pokud v budoucnu
              přidáme nepovinnou analytiku nebo marketingové nástroje, nejprve
              upravíme tyto informace a tam, kde je to nutné, vyžádáme souhlas.
            </p>
          </section>

          <section>
            <h2>7. Vaše práva</h2>
            <p>
              Můžete požádat o přístup ke svým údajům, jejich opravu, výmaz,
              omezení zpracování nebo vznést námitku. Máte také právo podat
              stížnost u Úřadu pro ochranu osobních údajů. Pro nejrychlejší
              vyřízení nás nejprve kontaktujte na{" "}
              <a href="mailto:podpora@tcgceny.cz">podpora@tcgceny.cz</a>.
            </p>
          </section>

          <section>
            <h2>8. Změny těchto informací</h2>
            <p>
              Text aktualizujeme, pokud se změní funkce webu, používané služby
              nebo způsob zpracování údajů. Aktuální verze bude vždy dostupná na
              této stránce.
            </p>
          </section>
        </article>
      </div>

      <footer className="footer legal-footer">
        <div className="shell legal">
          <span>© 2026 TCG Ceny</span>
          <span>
            <Link href="/podminky-pouziti">Podmínky používání</Link>
            {" · "}
            <Link href="/">Hlavní stránka</Link>
          </span>
        </div>
      </footer>
    </main>
  );
}
