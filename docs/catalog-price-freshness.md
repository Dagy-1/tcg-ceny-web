# Chybějící ceny a pravdivá dostupnost — 31. 8. 2026

Oprava je lokální, zatím není nasazená. Nezaměňovat s produkčním feedem
Slevy a naskladnění nasazeným z af32f27.

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

## Bezpečné dokončení provozní opravy

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
