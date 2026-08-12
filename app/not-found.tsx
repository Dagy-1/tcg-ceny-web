import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <p className="eyebrow">Chyba 404</p>
        <h1 id="not-found-title">Tahle karta v katalogu není.</h1>
        <p>
          Odkaz už nemusí platit, nebo se stránka přesunula. Zkus katalog,
          případně se vrať na hlavní stránku.
        </p>
        <div className="not-found-actions">
          <Link className="button" href="/katalog/">Otevřít katalog</Link>
          <Link className="button button-ghost" href="/">Zpět domů</Link>
        </div>
      </section>
    </main>
  );
}
