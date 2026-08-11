# Website deployment

The website is deployed as a Cloudflare Worker. Production and staging use
separate Worker names and separate D1 databases.

## Staging

- URL: `https://tcg-ceny-web-test.p-mladek99.workers.dev`
- Wrangler config: `wrangler.test.jsonc`
- D1 database: `tcg-ceny-portfolio-test`
- Catalog source: central API with the generated JSON snapshot as a fallback

Build the exact staging artifact before deploying it:

```powershell
$env:TCG_CLOUDFLARE_CONFIG = "wrangler.test.jsonc"
pnpm exec vite build
pnpm exec wrangler deploy --config dist/server/wrangler.json
```

Secrets belong in Cloudflare, never in this repository. Staging needs
`CENTRAL_API_SERVICE_TOKEN`, Discord and Google OAuth credentials, and a unique
`SESSION_SECRET`. OAuth applications must explicitly allow the staging callback
URLs from `wrangler.test.jsonc`.

## Production

Production uses `wrangler.jsonc`, Worker `tcg-ceny-web`, D1 database
`tcg-ceny-portfolio`, and routes for both `tcgceny.cz` and `www.tcgceny.cz`.
Do not deploy production until staging smoke tests, OAuth, account linking, and
portfolio create/update/delete have passed. Keep the previous production
deployment available for rollback until the post-deployment checks pass.
