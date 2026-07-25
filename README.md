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
3. Otevři `http://localhost:3000`.

Ruční spuštění v PowerShellu:

```powershell
$env:Path="C:\Users\mlade\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:Path"
C:\Users\mlade\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd run dev
```

Web se otevře na `http://localhost:3000`.

## Kontrola před publikováním

```powershell
C:\Users\mlade\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd run build
```

Složky `build/` a `worker/` jsou součástí nasazení a nemažou se.
