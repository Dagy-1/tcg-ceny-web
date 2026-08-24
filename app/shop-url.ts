const SUPPORTED_SHOP_HOSTS = new Set([
  "alza.cz",
  "bulbazard.cz",
  "geekhall.cz",
  "kitstore.cz",
  "knihydobrovsky.cz",
  "najada.games",
  "pikastore.cz",
  "pokesov.cz",
  "pompo.cz",
  "shadowball.cz",
  "smarty.cz",
  "sparkys.cz",
  "tlamagames.com",
  "tolarie.cz",
  "vesely-drak.cz",
  "vortexstore.eu",
]);

function normalizedHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
}

export function safeShopUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return SUPPORTED_SHOP_HOSTS.has(normalizedHostname(url.hostname)) ? url.href : null;
  } catch {
    return null;
  }
}
