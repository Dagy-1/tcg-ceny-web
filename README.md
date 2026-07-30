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

## Kontrola před publikováním

```powershell
npm test
```

Příkaz vytvoří statickou produkční verzi ve složce `out/` a následně
zkontroluje všechny veřejné stránky, sitemapu, robots.txt a bezpečnostní
hlavičky.

## Publikování na Netlify

1. Spusť `npm test`.
2. Nahraj obsah výsledné složky `out/` do stejného projektu na Netlify.
3. Po nasazení ověř `https://tcgceny.cz/` a `https://tcgceny.cz/sitemap.xml`.

Doména, HTTPS a e-mailové DNS záznamy se při běžné aktualizaci webu nemění.
