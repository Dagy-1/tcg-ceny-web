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
          Platnost od 29. 7. 2026.
        </p>
      </header>

      <div className="legal-content shell">
        <aside className="legal-summary privacy">
          <strong>Současný stav</strong>
          <p>
            Web nepoužívá reklamní ani analytické cookies. Portfolio využívá
            přihlášení přes Discord nebo Google a pouze technicky nezbytnou relační cookie.
          </p>
          <a href="mailto:podpora@tcgceny.cz">podpora@tcgceny.cz</a>
        </aside>

        <article className="legal-document">
          <section>
            <h2>1. Kdo údaje zpracovává</h2>
            <p>
              TCG Ceny je nezávislá česká technologická platforma zaměřená na
              porovnávání cen, sledování skladovosti a cenovou historii Pokémon
              TCG produktů. Pro dotazy nebo uplatnění práv použijte e-mail{" "}
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
                <strong>Přihlášení přes Discord:</strong> Discord ID, uživatelské
                jméno a případně avatar, které Discord předá po vašem potvrzení.
                Discord heslo ani přístup k vašim zprávám nezískáváme.
              </li>
              <li>
                <strong>Přihlášení přes Google:</strong> identifikátor Google účtu,
                zobrazované jméno, e-mailová adresa a případně profilový obrázek,
                které Google předá po vašem potvrzení. Google heslo nezískáváme.
              </li>
              <li>
                <strong>Portfolio:</strong> vybrané produkty, počet kusů,
                nákupní cena, datum nákupu a dobrovolná poznámka.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Účely a právní důvody</h2>
            <p>
              Údaje používáme pouze pro odpověď na dotaz, vyřízení požadavku,
              zabezpečení a technický provoz služby, prevenci zneužití a řešení
              chyb a poskytování osobního portfolia. Zpracování je založeno na
              poskytování vyžádané služby a na našem oprávněném zájmu na
              bezpečném a spolehlivém provozu.
            </p>
          </section>

          <section>
            <h2>4. Příjemci a poskytovatelé</h2>
            <p>
              Technické údaje mohou v nezbytném rozsahu zpracovávat poskytovatelé
              hostingu, databáze, domény, e-mailu a bezpečnostní infrastruktury.
              Pro přihlášení používáme služby Discord a Google. Údaje neprodáváme.
              K předání dalším osobám dochází jen tehdy, je-li to nutné pro
              provoz služby nebo vyžadováno právním předpisem.
            </p>
          </section>

          <section>
            <h2>5. Doba uchování</h2>
            <p>
              E-mailovou komunikaci uchováváme po dobu potřebnou k vyřízení a
              následné ochraně oprávněných zájmů. Technické logy uchovává
              provozovatel infrastruktury po omezenou dobu potřebnou pro
              zabezpečení a diagnostiku. Účetní identifikaci a portfolio
              uchováváme po dobu používání služby; o jejich výmaz lze požádat
              na kontaktním e-mailu. Nepotřebné údaje průběžně mažeme nebo
              anonymizujeme.
            </p>
          </section>

          <section>
            <h2>6. Cookies</h2>
            <p>
              Nepoužíváme reklamní, personalizační ani analytické cookies.
              Po přihlášení ukládáme technicky nezbytnou zabezpečenou cookie,
              která udržuje relaci a neumožňuje přístup k heslu Discord ani Google účtu. Relační
              cookie má omezenou platnost a lze ji odstranit odhlášením.
              Pokud v budoucnu přidáme nepovinnou analytiku nebo marketingové
              nástroje, nejprve upravíme tyto informace a tam, kde je to nutné,
              vyžádáme souhlas.
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
