# TCG Ceny – prezentační web

Oficiální prezentační web projektu TCG Ceny.

## Kde upravovat obsah

- `app/page.tsx` – hlavní stránka
- `app/pro-eshopy/page.tsx` – stránka pro e-shopy a partnery
- `app/globals.css` – vzhled celého webu
- `app/layout.tsx` – název, popis a metadata webu
- `public/` – obrázky a ikony

## Lokální spuštění

Nejjednodušší možnost:

1. Dvakrát klikni na `SPUSTIT-WEB.cmd`.
2. Terminál nech otevřený.
3. Otevři `http://localhost:3100`.

Ruční spuštění v PowerShellu:

```powershell
npm run dev
```

Web se otevře na `http://localhost:3100`. Příkaz spustí také lokální Worker,
Discord OAuth API a portfolio databázi.

## Centrální katalog API

Web načítá katalog přes vlastní cestu `/api/catalog/*`, kterou Worker bezpečně
předává centrálnímu Python API. Nastavte `CENTRAL_API_BASE_URL` na kořenovou URL
backendu, například `http://127.0.0.1:8000` pro lokální staging. URL se neposílá
do klientského JavaScriptu a Worker nepředává uživatelské cookies ani přihlašovací
hlavičky.

Pokud centrální API není nakonfigurované, neodpoví v limitu nebo vrátí neúplná
data, katalog automaticky ponechá snapshot vložený při buildu. Přechod je proto
vratný a výpadek backendu nezpůsobí prázdnou stránku. Detail produktu se při
otevření znovu načte z API, aby nabídky a časy kontroly byly aktuální.

## Kontrola před publikováním

```powershell
npm test
```

Příkaz vytvoří statickou produkční verzi ve složce `out/` a následně
zkontroluje všechny veřejné stránky, sitemapu, robots.txt a bezpečnostní
hlavičky.

## Publikování na Cloudflare Workers

1. Spusť `npm test`.
2. Nasaď Worker příkazem `npx wrangler deploy`.
3. Ověř testovací adresu `https://tcg-ceny-web.p-mladek99.workers.dev/`.
4. Po přepnutí nameserverů ověř také `https://tcgceny.cz/`, katalog,
   portfolio, sitemapu a přihlášení přes oba poskytovatele.

Před ostrým přechodem musí být u OAuth aplikací povolené tyto callbacky:

- `https://tcg-ceny-web.p-mladek99.workers.dev/api/auth/discord/callback`
- `https://tcgceny.cz/api/auth/discord/callback`
- `https://tcg-ceny-web.p-mladek99.workers.dev/api/auth/google/callback`
- `https://tcgceny.cz/api/auth/google/callback`

Worker callback odvozuje z aktuální povolené domény. Testovací a ostrá verze proto
mohou fungovat souběžně. Doména, HTTPS ani e-mailové DNS záznamy se při běžném
nasazení Workeru nemění.
