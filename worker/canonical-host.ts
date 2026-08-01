const PRODUCTION_HOST = "tcgceny.cz";
const WWW_HOST = `www.${PRODUCTION_HOST}`;

export function canonicalHostRedirect(request: Request): Response | null {
  const url = new URL(request.url);

  if (url.hostname.toLowerCase() !== WWW_HOST) {
    return null;
  }

  url.protocol = "https:";
  url.hostname = PRODUCTION_HOST;
  url.port = "";

  return Response.redirect(url.toString(), 308);
}
