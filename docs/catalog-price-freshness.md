# Chybějící ceny a pravdivá dostupnost — 31. 8. 2026

Oprava nasazena 31. 8. 2026, ověřeno 01:30 CEST. Webový zdroj `7cb2e14`,
produkční Worker `b3ab5a1c-3543-4509-ab45-6d73d1c74ef6`, staging
`ded36551-15ec-4a01-849a-f0417599b43c`. API datované ceny z `4cabf60` živě
ověřeny; finální lokální parser `606bd4d` (Pompo + dodatečná pojistka Alzy).
Nejde o záruku čerstvosti všech produktů; údaje níže jsou časové snapshoty.

## Výsledek nasazení

- Po uživatelově souhlasu přesně ověřeno 199 lokálních identit a neprázdných
  shop URL proti aktivním ověřeným centrálním odkazům. Explicitní scope
  125 → 201 (76 přidáno, původní zachovány); wildcard ani změna TTL nejsou použity.
- Šest skutečných refreshů: Houndstone a Mabosstiff online za 999 Kč,
  Ogerpon unavailable/null, Kangaskhan a Lucario unavailable s poslední
  známou cenou 699/999 Kč. Běžná synchronizace dalších produktů pokračuje.
- Gardevoir navíc odhalil chybu Alzy: doporučený Booster Bundle za 999 Kč
  byl čten jako cena ukončeného produktu. Finální parser rozpozná i vnořené
  hlavní „Prodej skončil“, vrací out/null a živě přepsal aktuální projekci
  01:28:43 CEST. Poslední známá cena produktu je nyní 3199 Kč z TLAMAGames.
- Snapshot 01:29: 171 sealed produktů, 83 online, **0 online bez ceny**,
  65 unknown a 46 stale. Obnovení všech cen zatím není dokončeno; neznámé
  a historické nabídky jsou na webu výslovně odlišené od aktuálních.
- Čistý web: 34/34 testů, Next 240 stránek, oba Vinext buildy. Konečný
  pracovní backend: 576/576 testů, cíleně 23/23. Staging/prod smoke a browser
  ověřily karty/detail, hledání, datum staré ceny a bez horizontálního přetečení.
  Veřejný feed přesně odpovídá doručeným Discord událostem; 7d 3+6, 30d 14+16.
- Hlavní bot opět připojen k Discordu, existující supervisor obnoven.
  Další krok: po běžném cyklu zkontrolovat stale položky a ručně ověřit
  zbývající neshody URL/identit. Neprohlašovat neověřený produkt za skladem.

## Zjištěné příčiny

- Read-only produkční snapshot měl 171 sealed produktů: 84 online (4 bez ceny),
  19 unavailable a 68 unknown; 49 z poslední skupiny mělo pouze stale nabídky.
- Houndstone a Mabosstiff měly centrální pozorování z 31. 7. 2026. Lokální
  centrální mirror je omezen na explicitních 125 ID a obě ID v něm chybí.
  Rozšíření seznamu není automaticky provedeno; wildcard nebyl použit.
- Pompo skrývá cenu u ukončeného nebo nedostupného produktu. Ogerpon a
  Kangaskhan mají `soldout-alert`, Lucario má `product-watchdog-info`.
  Obecné čtení delivery/JSON-LD mohlo převzít skladovost jiného produktu.
  Cena ze skrytého JSON-LD nesmí nahradit chybějící viditelnou cenu.

## Implementace

- Parser upřednostňuje hlavní oznámení o nedostupnosti, omezuje viditelnou
  cenu/delivery na hlavní produkt a JSON-LD páruje s H1. Přeškrtnutá původní
  cena je vyloučena. Živé read-only ověření Ogerponu vrátilo `out`, bez ceny.
- API zachovává čtyři dostupnosti. Vedle nezměněné nejlepší aktuální online
  ceny poskytuje zvlášť `last_known_price_czk` a `last_known_price_at` z
  nejnovějšího cenového pozorování v aktuálních aktivních projekcích nabídek.
  Není to úplná historická řada; chybějící historická cena se nedopočítává.
- Web zachovává `unknown`, má samostatný filtr, na kartě/detailu uvádí
  historickou cenu pouze s datem. Staré a neověřené nabídky jsou na detailu
  oddělené od dostupných. Chybějící cena nemůže být označena jako „Nejlepší“.
- Generátor snapshotu vyřazuje staré nabídky z aktuálního minima, uchovává
  unknown a v JSON-LD neoznačuje unknown jako dostupnou nabídku.

## Použitý postup a pravidla pro další rozšíření

1. Po schválení nasazení oddělit související soubory od uživatelských změn.
   Backend/API a parser mají kořenový Git, web vlastní Git.
2. Před rozšířením dosavadních 125 ID znovu read-only porovnat přesné aktivní
   katalogové identity a konfigurované URL. Nevytvářet fuzzy vazby ani `*`.
   Změna tohoto provozního rozsahu vyžaduje souhlas uživatele.
3. Nasadit API a web nejprve přes staging. Aktualizaci hlavního bota provést
   řízeným restartem pouze jeho ověřeného procesního stromu; zachovat existující
   throttling, cooldowny, cenové pojistky, potvrzování a deduplikaci alertů.
4. Pouze nově změřená data z povolených produktů mohou být zapsána jako čerstvá.
   Neposunovat timestamp červencových cen, neobcházet stale TTL a nevydávat
   cache import za nový scrape. Obnovování dělat po malých ověřených dávkách.
5. Ověřit nové checked_at/ceny v centrálním API a na webu, míru chyb e-shopů
   a žádné falešné restock/price-drop události. Neslibovat všech 171 cen:
   skutečně nedostupné nabídky mohou cenu nadále postrádat.

Lokální vizuální náhled na 3119 používá čtyři read-only veřejné API snapshoty,
bez zápisu do databáze či Discordu; není dokladem produkční opravy.
