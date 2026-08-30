# Soví ilustrace průvodce

## Sealed rekvizity — aktualizace 30. 8. 2026

Katalog, portfolio a porovnání používají nové `owl-{search,collection,compare}-v3-sealed-alpha.webp` v `public/brand/tour/`. Ostatní tři kroky zůstávají na `v2-alpha`. Nové ilustrace vytvořil vestavěný image_gen, nikoli CLI/API. Průhlednost následně zajistil již schválený lokální skript `node scripts/prepare-tour-transparency.cjs --sealed`. Zdrojové `v3-sealed-source.webp` jsou bezeztrátové zmenšeniny na 480 × 480; extrakce má toleranci 4 pro katalog a portfolio, 2 pro porovnání, aby zachovala tmavé peří. Všechny starší verze jsou zachované.

Postava zachovává výtvarnou identitu; generativní změna rekvizit není pixelově totožná s předchozí pózou. Extrakce pozadí naopak ověřuje přesné RGB zachovaných pixelů nového zdroje. Web nepřidává rámeček ani barevné prolínání.

### Použité prompty

#### search

Use case: precise-object-edit. Image 1 is the edit target and exact owl identity reference. Premium small website onboarding illustration, same polished shaded 2D style. Preserve the SAME owl face, natural navy eyes with gold irises and small white highlights, cream facial feathers, green/gold monocle on viewer-right, navy/gold plumage, proportions, full body and feet. Modify ONLY props and wing positions needed to hold them. Square canvas, full body entire props inside with 7% empty margin, subject about 86% image height, readable at 180px. No words, letters, brands, logos, numbers, individual loose cards, no frame, no shadows or glow outside silhouette. Background should be genuinely transparent alpha. If real alpha is not available, use perfectly uniform flat dark navy #061328 for later local extraction; NEVER draw a checkerboard or white background. Replace the single trading card with a clearly THREE DIMENSIONAL sealed BOOSTER BOX, a deep rectangular cuboid with visible top lid and side panel, navy and gold geometric star design, shrink-wrap edge highlight. Owl looks attentively toward the box and holds the golden magnifying glass over the box, not over its face. Box comfortably supported in other wing at chest/belly height. Must unmistakably read as a thick factory sealed retail box, NOT a flat card.

#### collection

Use case: precise-object-edit. Image 1 is the edit target and exact owl identity reference. Premium small website onboarding illustration, same polished shaded 2D style. Preserve the SAME owl face, natural navy eyes with gold irises and small white highlights, cream facial feathers, green/gold monocle on viewer-right, navy/gold plumage, proportions, full body and feet. Modify ONLY props and wing positions needed to hold them. Square canvas, full body entire props inside with 7% empty margin, subject about 86% image height, readable at 180px. No words, letters, brands, logos, numbers, individual loose cards, no frame, no shadows or glow outside silhouette. Background should be genuinely transparent alpha. If real alpha is not available, use perfectly uniform flat dark navy #061328 for later local extraction; NEVER draw a checkerboard or white background. Replace the open binder COMPLETELY with a large closed ELITE TRAINER BOX held proudly in BOTH wings at belly level. Wide horizontal substantial rectangular cuboid, navy with elegant gold angular graphics, lid seam, visible top and side in three-quarter perspective and restrained shrinkwrap highlights. Place a second smaller closed burgundy/gold booster box beside the owl's feet. No book, no album, no loose cards. Keep entire smiling face unobstructed.

#### compare

Use case: precise-object-edit. Image 1 is the edit target and exact owl identity reference. Premium small website onboarding illustration, same polished shaded 2D style. Preserve the SAME owl face, natural navy eyes with gold irises and small white highlights, cream facial feathers, green/gold monocle on viewer-right, navy/gold plumage, proportions, full body and feet. Modify ONLY props and wing positions needed to hold them. Square canvas, full body entire props inside with 7% empty margin, subject about 86% image height, readable at 180px. No words, letters, brands, logos, numbers, individual loose cards, no frame, no shadows or glow outside silhouette. Background should be genuinely transparent alpha. If real alpha is not available, use perfectly uniform flat dark navy #061328 for later local extraction; NEVER draw a checkerboard or white background. Replace the balance-scale's flat trading cards with TWO substantial SEALED RETAIL BOXES. Composition owl centered behind a small gold balance scale extending to either side at belly level. One navy/gold sealed booster box on left pan, one burgundy/gold sealed ETB on right pan. Both boxes have visible tops, side depth, closed lid seams and subtle shrinkwrap highlights, simple broad decorative shapes without text. Owl holds center handle with one wing, looks thoughtfully between boxes. Scale pans wide enough for boxes, elegant simple supports readable small. Full face/feet and both boxes visible, no flat cards.


Připraveno 30. 8. 2026 vestavěným nástrojem image_gen (nikoli CLI/API).
Referencí je `public/brand/tcg-ceny-owl-mascot-v1.webp`; původní soubor zůstal beze změny.

Šest finálních assetů je v `public/brand/tour/owl-{welcome,search,price-drop,alert,collection,compare}-v2-alpha.webp`.
WebP 480 × 480, lossless, **skutečný alfa kanál**. Původní `v1.webp` soubory jsou zachované.
Po uživatelově souhlasu s lokálním skriptem odstranil `scripts/prepare-tour-transparency.cjs`
tmavý podklad pomocí výplně od okrajů (tolerance 7 vůči mediánu RGB prázdného obvodu).
Zachované pixely sovy mají přesně původní RGB; izolované podobně barevné oči a peří se nemažou.
Skript nepřekresluje postavu a nepoužívá síť. Regrese dekóduje všechny výstupy, kontroluje
alfa kanál, průhledné okraje, podíl průhledné plochy a původní barvy.
CSS už nemá vlastní rámeček, podklad, barevné prolínání ani maskování sovy.
Za výřezem je přímo vidět stejný podklad společného panelu jako za textem.
První generování s požadavkem na alfa průhlednost
vrátilo vykreslenou šachovnici, proto nebylo použito. Pózy nejsou vrstvené animační rigy;
průvodce používá jen jednorázové objevení, bez pohybu očí či deformace celé sovy.

## Společný finální prompt

Use case: identity-preserve. Asset type: one transparent full-body mascot illustration for a compact premium dark website onboarding panel. Image 1 is the original character reference. Create exactly the SAME owl character in a new pose, matching original clean polished 2D shaded illustration, navy feathers, golden wing and ear accents, cream face/belly, gold iris with dark navy pupils and small natural white catchlights, and green/gold monocle on viewer-right eye. Preserve facial proportions and character identity, do not redesign eyes. Square canvas, entire character and props visible, centered, about 86% canvas height, even 7% clear margin. Perfectly uniform flat dark navy background RGB(11,23,39) hex #0b1727, no checkerboard, no scenery, no ground, no text, no letters, no watermark. Replace original held props with ONLY props described below. Strong clear silhouette at 180px display size. 

## Jednotlivé pózy

### welcome

Friendly greeting: owl looking at viewer, one wing raised beside its head in a welcoming wave, other wing relaxed. No cards and no graph, no additional props. Keep feather fingers clearly a bird wing.

### search

Searching catalogue: owl holding a single large gold-rimmed magnifying glass beside its face, inspecting one navy trading card with a simple gold star emblem in its other wing. Do not cover or magnify its eyes. No graph.

### price-drop

Price drop: owl looking down toward a small navy and gold framed chart held beside its body. Chart contains only a bold green zigzag descending from upper LEFT to lower RIGHT, with a downward arrowhead. Wing pointing at the low end. No upward graph, no currency symbols, no other props.

### alert

Tracking alert: owl holding one small golden notification bell with a tiny emerald signal dot, attentive friendly expression, other wing indicating the bell. No cards, no graph, no text.

### collection

Portfolio collection: owl proudly holding an open navy and gold collector binder in both wings at belly level, six clearly visible card pockets, each with a simple golden star motif. Face fully visible, no other props.

### compare

Comparison: owl holding a compact gold balance scale in one wing, two visible pans each carrying one navy trading card with a gold star. Looking thoughtfully toward the scale, face unobstructed. No chart, no extra props.

## Oprava pozadí prvních tří ilustrací

Use case: precise-object-edit. Replace ONLY the checkerboard background with a perfectly uniform solid dark navy RGB(11,23,39), hex #0b1727. Keep the owl, eyes, pose, prop, colors, shape, scale, placement and entire composition EXACTLY unchanged. Remove checkerboard also through transparent magnifying glass if present; keep its blue glass highlight. No new elements, no text, no shadow or lighting in background. Same square framing.
