# TCG Ceny webové portfolio

Portfolio používá oficiální Discord a Google OAuth2, podepsanou `HttpOnly` cookie
a Cloudflare D1. Hesla ani platební údaje aplikace nezpracovává.

## Lokální API

1. Zkopíruj `.dev.vars.example` jako `.dev.vars` a doplň údaje Discord a Google aplikace.
2. V Discord Developer Portal nastav callback:
   `http://localhost:3100/api/auth/discord/callback`.
3. V Google Cloud Console nastav callback:
   `http://localhost:3100/api/auth/google/callback`.
4. Spusť `pnpm dev`. Lokální D1 databáze a migrace se připraví automaticky.
5. Otevři `http://localhost:3100/portfolio/` a zvol poskytovatele přihlášení.

## Produkční nasazení

1. Vytvoř D1 databázi a nastav binding `DB`.
2. Ulož `DISCORD_CLIENT_SECRET` a `SESSION_SECRET` jako Worker secrets.
3. Nastav `DISCORD_CLIENT_ID` a produkční `DISCORD_REDIRECT_URI`.
4. Produkční callback musí být:
   `https://tcgceny.cz/api/auth/discord/callback`.
5. Google produkční callback musí být:
   `https://tcgceny.cz/api/auth/google/callback`.
6. Aplikuj migraci před prvním povolením přihlášení.

`SESSION_SECRET` musí být náhodný a mít nejméně 32 bajtů. Tajné hodnoty nikdy
nepatří do Gitu ani do klientského JavaScriptu.
