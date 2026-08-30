# Slevy a naskladnění: web a Discord

Nasazeno a ověřeno 31. 8. 2026 v 00:48 CEST na https://tcgceny.cz/zlevneni/.
Backend commit `eb565c3bea3b267c62026883cbc46b1e6eb6aa9f`, webový zdroj
`af32f27c2dfa4520eb22677d94409280bdb27653`, produkční Worker
`1708ad1f-8524-4bcf-9a13-bd915f2390cd`.

- Při ověření: 3 naskladnění / 6 slev za 7 dní, 14 naskladnění / 16 slev
  za 30 dní. Skutečná historie byla dostupná bez backfillu a bez opakovaného
  odesílání na Discord. Počty se s časem mění.
- Read-only porovnání centrálního API, stagingu a produkce s doručeným outboxem
  potvrdilo přesné event ID, product ID a ceny pro oba typy a období.
- Ověřeno 547 backendových testů z čistého commitu, 33 webových testů,
  ESLint, TypeScript, Next build 240 stránek a oba Vinext buildy. Produkční
  smoke ověřil šest hlavních stránek, API, stránkování, ochranu osobních alertů
  a start OAuth. Browser potvrdil skutečné produkty a načtené obrázky.

- Navigace **Slevy a naskladnění** používá dosavadní URL `/zlevneni/`, aby zůstaly funkční
  existující odkazy. Filtry: Vše, Zlevnění, Nově skladem; období 1/7/30 dní.
- Worker beze změny proxyuje `/api/catalog/changes` do centrálního
  `/api/v1/catalog/changes`. Parametry: `event_type=all|price_drop|restock`,
  `sort=newest|largest`, `limit=1..100`, `offset=0..100000`.
- Zdroj je existující `NotificationOutbox`: channel discord, bez user_id,
  audience public, status sent a neprázdné sent_at. Web nevytváří vlastní
  události a neodesílá nové zprávy. Event key je totožný s Discord frontou.
- Původní `/price-drops` endpoint zůstává zpětně kompatibilní a vrací pouze slevy.
- Detekce naskladnění se nemění: první snapshot je tichý baseline; veřejný
  restock vzniká při návratu produktu z absence online nabídky do prodeje.
  Osobní sledování a jeho širší pravidla jsou samostatné a neveřejné.
- Naskladnění nemá starou cenu ani slevová procenta. Cena může chybět;
  zobrazuje se „Cena neuvedena“. Čas je čas odeslání na Discord, ne příslib,
  že je nabídka stále dostupná. UI to výslovně uvádí.
- Web žádá 24 položek na stránku, filtruje a řadí backend. Backend stejně
  jako původní feed načítá doručené záznamy z vybraného období, normalizuje
  a teprve poté stránkuje; nejde o SQL LIMIT nad již normalizovanými událostmi.
  Při růstu objemu je dalším krokem materializovaný/indexovaný veřejný feed.
- První stránka se při viditelném dokumentu obnovuje každých 5 minut.
  Doručení do Discordu i krátká API cache mohou přidat zpoždění; nejde o
  současné doručení na milisekundu. Při chybě Discordu web čeká na status sent.
- Novinky jsou lokální pro prohlížeč (`tcg-ceny:last-seen-market-change:v1`).
  První návštěva nastaví baseline bez falešného „Nové“. Jen první nejnovější
  nevyfiltrovaná stránka posouvá přečtení; čas nikdy nejde zpět. Zákaz úložiště
  neblokuje veřejný přehled. Není to synchronizace přečtení přes Discord účet.

## Bezpečné nasazení

1. Oddělit pouze související backend soubory od rozpracovaných root změn;
   root a website mají vlastní Git. Žádné runtime DB, testovací data ani secrets.
2. Nasadit backend jako první (beze změny DB schématu/bez migrace). Ověřit
   `/api/v1/catalog/changes` s oběma typy a staré `/price-drops` API.
3. Nasadit web na staging, ověřit filtry, stránkování, anonymní public feed,
   zachované 401 pro osobní alerty a neprůchodnost soukromých událostí.
4. Porovnat skutečná veřejná event ID s doručenými outbox záznamy bez
   opětovného odesílání zpráv. Teprve pak nasadit web na produkci.

Lokální vizuální fixture `tmp/market-changes-preview.py` v kořenovém repozitáři
je necommitovaný pomocný server na 127.0.0.1:3118. Používá paměťové SQLite,
29 jasně označených ukázkových událostí a skutečnou implementaci backendu.
Nejde o živé ceny ani důkaz produkčního nasazení. Port 3117 je starší náhled.
