import portfolioData from "../app/portfolio/portfolio-data.json" with { type: "json" };
import { anonymousClientKey } from "./catalog-api.ts";

type Env = {
  DB: D1Database;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_REDIRECT_URI: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  SESSION_SECRET: string;
  CENTRAL_API_BASE_URL?: string;
  CENTRAL_API_SERVICE_TOKEN?: string;
  PORTFOLIO_DATA_SOURCE?: string;
};

type AuthProvider = "discord" | "google";

type SessionUser = {
  sub: string;
  username: string;
  avatar: string | null;
  provider: AuthProvider;
  exp: number;
};

type OAuthState = {
  provider: AuthProvider;
  state: string;
  verifier: string;
  returnTo: string;
  exp: number;
  linkFrom?: SessionUser;
};

type CatalogProduct = {
  id: string;
  name: string;
  type: string;
  era: string;
  set: string;
  image: string;
  marketPrice: number | null;
  priceUpdatedAt: string;
};

const SESSION_COOKIE = "tcg_session";
const OAUTH_COOKIE = "tcg_oauth";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const CENTRAL_REQUEST_TIMEOUT_MS = 5_000;
const CENTRAL_PRODUCT_REQUEST_TIMEOUT_MS = 12_000;
const encoder = new TextEncoder();
const OAUTH_CALLBACK_HOSTS = new Set([
  "tcgceny.cz",
  "tcg-ceny-web.tcg-ceny.workers.dev",
  "tcg-ceny-web-test.tcg-ceny.workers.dev",
  "tcg-ceny-web.p-mladek99.workers.dev",
  "tcg-ceny-web-test.p-mladek99.workers.dev",
  "localhost",
  "127.0.0.1",
]);
const products = new Map(
  (portfolioData.products as CatalogProduct[]).map((product) => [product.id, product]),
);

type CentralPortfolioItem = {
  id: string;
  product: { id: string; name: string; image_url: string | null };
  quantity: number;
  buy_price_czk: number;
  buy_date: string;
  note: string;
  latest_market_price: { price_czk: number; priced_on: string } | null;
};

function portfolioDataSource(env: Env) {
  return String(env.PORTFOLIO_DATA_SOURCE || "legacy").trim().toLowerCase();
}

function centralIdentitySubject(user: SessionUser) {
  const prefix = `${user.provider}:`;
  return user.sub.startsWith(prefix) ? user.sub.slice(prefix.length) : user.sub;
}

function centralProduct(item: CentralPortfolioItem) {
  const embedded = products.get(item.product.id);
  return {
    id: item.product.id,
    name: item.product.name,
    type: embedded?.type ?? "",
    era: embedded?.era ?? "",
    set: embedded?.set ?? "",
    image: item.product.image_url || embedded?.image || "",
    marketPrice: item.latest_market_price?.price_czk ?? embedded?.marketPrice ?? null,
    priceUpdatedAt: item.latest_market_price?.priced_on ?? embedded?.priceUpdatedAt ?? "",
  };
}

function webPortfolioItem(item: CentralPortfolioItem) {
  return {
    id: item.id,
    productId: item.product.id,
    quantity: item.quantity,
    buyPrice: item.buy_price_czk,
    buyDate: item.buy_date,
    note: item.note,
    product: centralProduct(item),
  };
}

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlText(value: string) {
  return base64Url(encoder.encode(value));
}

function decodeBase64Url(value: string) {
  return new TextDecoder().decode(decodeBase64UrlBytes(value));
}

function decodeBase64UrlBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function hmacKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usage,
  );
}

async function hmac(value: string, secret: string) {
  const key = await hmacKey(secret, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

async function signedToken(payload: object, secret: string) {
  const encoded = base64UrlText(JSON.stringify(payload));
  return `${encoded}.${await hmac(encoded, secret)}`;
}

async function readSignedToken<T>(token: string | undefined, secret: string): Promise<T | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  try {
    const key = await hmacKey(secret, ["verify"]);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64UrlBytes(signature),
      encoder.encode(payload),
    );
    if (!valid) return null;
    return JSON.parse(decodeBase64Url(payload)) as T;
  } catch {
    return null;
  }
}

function cookie(request: Request, name: string) {
  const values = request.headers.get("Cookie")?.split(";") ?? [];
  for (const value of values) {
    const [key, ...rest] = value.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

function setCookie(request: Request, name: string, value: string, maxAge: number) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${maxAge}`;
}

function randomToken(size = 32) {
  return base64Url(crypto.getRandomValues(new Uint8Array(size)));
}

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/portfolio/";
  return value.slice(0, 500);
}

function hasDiscordOAuthConfig(env: Env) {
  return [
    env.DISCORD_CLIENT_ID,
    env.DISCORD_CLIENT_SECRET,
    env.SESSION_SECRET,
  ].every((value) => (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !value.startsWith("your_") &&
    !value.startsWith("generate_")
  ));
}

function hasGoogleOAuthConfig(env: Env) {
  return [
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.SESSION_SECRET,
  ].every((value) => (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !value.startsWith("your_") &&
    !value.startsWith("generate_")
  ));
}

export function oauthRedirectUri(
  request: Request,
  provider: AuthProvider,
  configuredRedirectUri = "",
) {
  const requestUrl = new URL(request.url);
  const callbackPath = `/api/auth/${provider}/callback`;

  if (OAUTH_CALLBACK_HOSTS.has(requestUrl.hostname.toLowerCase())) {
    return new URL(callbackPath, requestUrl.origin).toString();
  }

  try {
    const configured = new URL(configuredRedirectUri);
    if (
      OAUTH_CALLBACK_HOSTS.has(configured.hostname.toLowerCase()) &&
      configured.pathname === callbackPath
    ) {
      return configured.toString();
    }
  } catch {
    // Invalid or missing fallback configuration is handled by the caller.
  }

  return null;
}

function authErrorRedirect(request: Request, returnTo: string, code: string) {
  const target = new URL(safeReturnTo(returnTo), request.url);
  target.searchParams.set("auth_error", code);
  return Response.redirect(target, 302);
}

function sameIdentity(left: SessionUser | null, right: SessionUser) {
  return Boolean(
    left && left.provider === right.provider && left.sub === right.sub,
  );
}

async function session(request: Request, env: Env) {
  const user = await readSignedToken<SessionUser>(cookie(request, SESSION_COOKIE), env.SESSION_SECRET);
  if (!user || user.exp <= Math.floor(Date.now() / 1000)) return null;
  return user;
}

function validMutationOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export async function centralPortfolioRequest(
  request: Request,
  user: SessionUser,
  env: Env,
  itemId?: string,
  resource: "items" | "history" = "items",
) {
  const baseUrl = env.CENTRAL_API_BASE_URL?.trim();
  const serviceToken = env.CENTRAL_API_SERVICE_TOKEN?.trim();
  if (!baseUrl || !serviceToken || serviceToken.length < 32) {
    return json({ error: "Centrální portfolio není nakonfigurované." }, 503);
  }

  let upstreamBase: URL;
  try {
    upstreamBase = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  } catch {
    return json({ error: "Centrální portfolio má neplatnou konfiguraci." }, 503);
  }

  if (request.method !== "GET" && !validMutationOrigin(request)) {
    return json({ error: "Neplatný původ požadavku." }, 403);
  }

  const upstreamUrl = new URL(
    `/api/v1/portfolio/${resource}${resource === "items" && itemId ? `/${encodeURIComponent(itemId)}` : ""}`,
    upstreamBase,
  );
  if (resource === "history") {
    upstreamUrl.searchParams.set("days", new URL(request.url).searchParams.get("days") || "90");
  }
  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${serviceToken}`,
    "X-TCG-Identity-Provider": user.provider,
    "X-TCG-Identity-Subject": centralIdentitySubject(user),
    "X-TCG-Identity-Name": user.username.slice(0, 120),
    "X-Request-ID": crypto.randomUUID(),
  });
  if (user.avatar) headers.set("X-TCG-Identity-Avatar", user.avatar);

  let body: string | undefined;
  if (request.method === "POST" || request.method === "PATCH") {
    let input: Record<string, unknown>;
    try {
      input = await request.json<Record<string, unknown>>();
    } catch {
      return json({ error: "Neplatná data." }, 400);
    }
    const translated: Record<string, unknown> = {
      quantity: input.quantity,
      buy_price_czk: input.buyPrice,
      buy_date: input.buyDate,
      note: input.note,
    };
    if (request.method === "POST") translated.product_id = input.productId;
    body = JSON.stringify(translated);
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CENTRAL_REQUEST_TIMEOUT_MS);
  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
    });
    if (upstream.status === 204) {
      return new Response(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
    }
    const payload = await upstream.json() as Record<string, unknown>;
    if (!upstream.ok) {
      return json(
        { error: String(payload.detail || "Centrální portfolio požadavek odmítlo.") },
        upstream.status,
      );
    }
    if (request.method === "GET" && resource === "history") {
      const points = Array.isArray(payload.points)
        ? (payload.points as Record<string, unknown>[]).map((point) => ({
            date: String(point.valued_on || ""),
            invested: Number(point.invested_czk) || 0,
            marketValue: Number(point.market_value_czk) || 0,
            profit: Number(point.profit_czk) || 0,
          }))
        : [];
      const investmentPoints = Array.isArray(payload.investment_points)
        ? (payload.investment_points as Record<string, unknown>[]).map((point) => ({
            date: String(point.invested_on || ""),
            invested: Number(point.invested_czk) || 0,
          }))
        : [];
      return json({
        days: Number(payload.days) || 90,
        points,
        investmentPoints,
        firstDate: payload.first_valued_on || null,
        latestDate: payload.latest_valued_on || null,
      });
    }
    if (request.method === "GET") {
      const items = Array.isArray(payload.items)
        ? (payload.items as CentralPortfolioItem[]).map(webPortfolioItem)
        : [];
      return json({ items, summary: payload.summary });
    }
    return json(
      webPortfolioItem(payload as unknown as CentralPortfolioItem),
      upstream.status,
    );
  } catch {
    return json({ error: "Centrální portfolio je dočasně nedostupné." }, 502);
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleCatalogReportApi(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const requestUrl = new URL(request.url);
  if (requestUrl.pathname !== "/api/catalog/reports") return null;
  if (request.method !== "POST") return json({ error: "Metoda není podporovaná." }, 405);
  if (!validMutationOrigin(request)) return json({ error: "Neplatný původ požadavku." }, 403);

  const baseUrl = env.CENTRAL_API_BASE_URL?.trim();
  const serviceToken = env.CENTRAL_API_SERVICE_TOKEN?.trim() || "";
  if (!baseUrl || serviceToken.length < 32) {
    return json({ error: "Hlášení problémů zatím není dostupné." }, 503);
  }
  const clientKey = await anonymousClientKey(request, serviceToken);
  if (!clientKey) return json({ error: "Požadavek se nepodařilo bezpečně ověřit." }, 403);
  const currentUser = await session(request, env);
  if (!currentUser) {
    return json({ error: "Pro odeslání hlášení se nejprve přihlas." }, 401);
  }

  let input: Record<string, unknown>;
  try {
    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > 16_384) return json({ error: "Hlášení je příliš dlouhé." }, 413);
    input = await request.json<Record<string, unknown>>();
  } catch {
    return json({ error: "Hlášení nemá platný formát." }, 400);
  }

  const referer = request.headers.get("Referer");
  let pagePath: string | null = null;
  if (referer) {
    try {
      const page = new URL(referer);
      if (page.origin === requestUrl.origin && page.pathname.startsWith("/produkt/")) {
        pagePath = `${page.pathname}${page.search}`.slice(0, 500);
      }
    } catch {
      pagePath = null;
    }
  }
  const body = JSON.stringify({
    product_id: input.product_id,
    issue_type: input.issue_type,
    note: input.note,
    shop: input.shop,
    offer_url: input.offer_url,
    displayed_price_czk: input.displayed_price_czk,
    displayed_availability: input.displayed_availability,
    page_path: pagePath,
  });

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL("/api/v1/catalog/reports", baseUrl);
  } catch {
    return json({ error: "Hlášení problémů má neplatnou konfiguraci." }, 503);
  }
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Request-ID": crypto.randomUUID(),
    "X-TCG-Proxy-Token": serviceToken,
    "X-TCG-Client-Key": clientKey,
  });
  headers.set("Authorization", `Bearer ${serviceToken}`);
  headers.set("X-TCG-Identity-Provider", currentUser.provider);
  headers.set("X-TCG-Identity-Subject", centralIdentitySubject(currentUser));
  headers.set("X-TCG-Identity-Name", currentUser.username.slice(0, 120));
  if (currentUser.avatar) headers.set("X-TCG-Identity-Avatar", currentUser.avatar);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CENTRAL_REQUEST_TIMEOUT_MS);
  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    const payload = await upstream.json<Record<string, unknown>>().catch(() => ({}));
    if (!upstream.ok) {
      return json(
        { error: String(payload.detail || "Hlášení se nepodařilo přijmout.") },
        upstream.status,
        upstream.headers.get("Retry-After")
          ? { "Retry-After": upstream.headers.get("Retry-After") as string }
          : undefined,
      );
    }
    return json(payload, upstream.status);
  } catch {
    return json({ error: "Hlášení problémů je dočasně nedostupné." }, 502);
  } finally {
    clearTimeout(timeout);
  }
}

export async function centralPortfolioProductsRequest(request: Request, env: Env) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return json({ error: "Metoda není podporovaná." }, 405);
  }
  const baseUrl = env.CENTRAL_API_BASE_URL?.trim();
  const serviceToken = env.CENTRAL_API_SERVICE_TOKEN?.trim() || "";
  if (!baseUrl) return json({ error: "Centrální katalog portfolia není nakonfigurovaný." }, 503);

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL("/api/v1/portfolio/products", baseUrl);
  } catch {
    return json({ error: "Centrální katalog portfolia má neplatnou konfiguraci." }, 503);
  }
  const sourceUrl = new URL(request.url);
  upstreamUrl.search = sourceUrl.search;
  const headers = new Headers({ Accept: "application/json", "X-Request-ID": crypto.randomUUID() });
  const clientKey = await anonymousClientKey(request, serviceToken);
  if (clientKey) {
    headers.set("X-TCG-Proxy-Token", serviceToken);
    headers.set("X-TCG-Client-Key", clientKey);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CENTRAL_PRODUCT_REQUEST_TIMEOUT_MS);
  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      signal: controller.signal,
    });
    const responseHeaders = new Headers({
      "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8",
      "Cache-Control": upstream.headers.get("Cache-Control") || "public, max-age=300, stale-while-revalidate=900",
      "X-TCG-Portfolio-Product-Source": "central-api",
    });
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return json({ error: "Centrální katalog portfolia je dočasně nedostupný." }, 502);
  } finally {
    clearTimeout(timeout);
  }
}

async function linkCentralIdentity(
  request: Request,
  user: SessionUser,
  env: Env,
  provider: AuthProvider,
  accessToken: string,
) {
  const baseUrl = env.CENTRAL_API_BASE_URL?.trim();
  const serviceToken = env.CENTRAL_API_SERVICE_TOKEN?.trim();
  if (!baseUrl || !serviceToken || serviceToken.length < 32) return "link_unavailable";

  const upstreamUrl = new URL("/api/v1/account/identities", baseUrl);
  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${serviceToken}`,
    "Content-Type": "application/json",
    "X-TCG-Identity-Provider": user.provider,
    "X-TCG-Identity-Subject": centralIdentitySubject(user),
    "X-TCG-Identity-Name": user.username.slice(0, 120),
    "X-Request-ID": crypto.randomUUID(),
  });
  if (user.avatar) headers.set("X-TCG-Identity-Avatar", user.avatar);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CENTRAL_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ provider, access_token: accessToken }),
      signal: controller.signal,
    });
    if (response.ok) return null;
    return response.status === 409 ? "identity_in_use" : "link_failed";
  } catch {
    return "link_unavailable";
  } finally {
    clearTimeout(timeout);
  }
}

async function linkedCentralProviders(
  user: SessionUser,
  env: Env,
): Promise<AuthProvider[]> {
  const fallback: AuthProvider[] = [user.provider];
  const baseUrl = env.CENTRAL_API_BASE_URL?.trim();
  const serviceToken = env.CENTRAL_API_SERVICE_TOKEN?.trim();
  if (!baseUrl || !serviceToken || serviceToken.length < 32) return fallback;

  const upstreamUrl = new URL("/api/v1/account/identities", baseUrl);
  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${serviceToken}`,
    "X-TCG-Identity-Provider": user.provider,
    "X-TCG-Identity-Subject": centralIdentitySubject(user),
    "X-TCG-Identity-Name": user.username.slice(0, 120),
    "X-Request-ID": crypto.randomUUID(),
  });
  if (user.avatar) headers.set("X-TCG-Identity-Avatar", user.avatar);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CENTRAL_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    if (!response.ok) return fallback;
    const payload = await response.json<{ providers?: unknown }>();
    if (!Array.isArray(payload.providers)) return fallback;
    const providers = payload.providers.filter(
      (provider): provider is AuthProvider => provider === "discord" || provider === "google",
    );
    return providers.length ? [...new Set(providers)] : fallback;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

async function beginDiscordLogin(request: Request, env: Env) {
  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get("return_to"));
  const redirectUri = oauthRedirectUri(request, "discord", env.DISCORD_REDIRECT_URI);
  if (!hasDiscordOAuthConfig(env) || !redirectUri) {
    return authErrorRedirect(request, returnTo, "discord_not_configured");
  }

  const state = randomToken();
  const verifier = randomToken(48);
  const challenge = base64Url(
    new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier))),
  );
  const linkFrom = url.searchParams.get("link") === "1" ? await session(request, env) : null;
  if (url.searchParams.get("link") === "1" && !linkFrom) {
    return authErrorRedirect(request, returnTo, "link_requires_login");
  }
  const payload = await signedToken(
    {
      provider: "discord",
      state,
      verifier,
      returnTo,
      exp: Math.floor(Date.now() / 1000) + 600,
      linkFrom: linkFrom ?? undefined,
    },
    env.SESSION_SECRET,
  );
  const authorize = new URL("https://discord.com/oauth2/authorize");
  authorize.search = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      "Set-Cookie": setCookie(request, OAUTH_COOKIE, payload, 600),
      "Cache-Control": "no-store",
    },
  });
}

async function finishDiscordLogin(request: Request, env: Env) {
  const url = new URL(request.url);
  const redirectUri = oauthRedirectUri(request, "discord", env.DISCORD_REDIRECT_URI);
  const oauth = await readSignedToken<OAuthState>(cookie(request, OAUTH_COOKIE), env.SESSION_SECRET);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (
    !oauth ||
    oauth.provider !== "discord" ||
    oauth.exp < Date.now() / 1000 ||
    !state ||
    oauth.state !== state ||
    !code ||
    !redirectUri
  ) {
    return authErrorRedirect(request, oauth?.returnTo ?? "/portfolio/", "oauth_failed");
  }

  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: oauth.verifier,
    }),
  });
  if (!tokenResponse.ok) return authErrorRedirect(request, oauth.returnTo, "oauth_failed");
  const token = await tokenResponse.json<{ access_token: string }>();
  const profileResponse = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!profileResponse.ok) return authErrorRedirect(request, oauth.returnTo, "oauth_failed");
  const profile = await profileResponse.json<{ id: string; username: string; avatar: string | null }>();
  const profileAvatar = profile.avatar
    ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=64`
    : null;
  const now = Math.floor(Date.now() / 1000);

  if (oauth.linkFrom) {
    const current = await session(request, env);
    if (!sameIdentity(current, oauth.linkFrom)) {
      return authErrorRedirect(request, oauth.returnTo, "link_requires_login");
    }
    const error = await linkCentralIdentity(
      request,
      oauth.linkFrom,
      env,
      "discord",
      token.access_token,
    );
    if (error) return authErrorRedirect(request, oauth.returnTo, error);
    const target = new URL(safeReturnTo(oauth.returnTo), request.url);
    target.searchParams.set("account_linked", "discord");
    return Response.redirect(target, 302);
  }

  await env.DB.prepare(
    `INSERT INTO users (discord_user_id, username, avatar_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(discord_user_id) DO UPDATE SET
       username = excluded.username,
       avatar_hash = excluded.avatar_hash,
       updated_at = excluded.updated_at`,
  ).bind(profile.id, profile.username, profileAvatar, now, now).run();

  const tokenValue = await signedToken(
    {
      sub: profile.id,
      username: profile.username,
      avatar: profileAvatar,
      provider: "discord",
      exp: now + SESSION_SECONDS,
    },
    env.SESSION_SECRET,
  );
  const headers = new Headers({
    Location: safeReturnTo(oauth.returnTo),
    "Cache-Control": "no-store",
  });
  headers.append("Set-Cookie", setCookie(request, SESSION_COOKIE, tokenValue, SESSION_SECONDS));
  return new Response(null, { status: 302, headers });
}

async function beginGoogleLogin(request: Request, env: Env) {
  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get("return_to"));
  const redirectUri = oauthRedirectUri(request, "google", env.GOOGLE_REDIRECT_URI);
  if (!hasGoogleOAuthConfig(env) || !redirectUri) {
    return authErrorRedirect(request, returnTo, "google_not_configured");
  }

  const state = randomToken();
  const verifier = randomToken(48);
  const challenge = base64Url(
    new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier))),
  );
  const linkFrom = url.searchParams.get("link") === "1" ? await session(request, env) : null;
  if (url.searchParams.get("link") === "1" && !linkFrom) {
    return authErrorRedirect(request, returnTo, "link_requires_login");
  }
  const payload = await signedToken(
    {
      provider: "google",
      state,
      verifier,
      returnTo,
      exp: Math.floor(Date.now() / 1000) + 600,
      linkFrom: linkFrom ?? undefined,
    },
    env.SESSION_SECRET,
  );
  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      "Set-Cookie": setCookie(request, OAUTH_COOKIE, payload, 600),
      "Cache-Control": "no-store",
    },
  });
}

async function finishGoogleLogin(request: Request, env: Env) {
  const url = new URL(request.url);
  const redirectUri = oauthRedirectUri(request, "google", env.GOOGLE_REDIRECT_URI);
  const oauth = await readSignedToken<OAuthState>(cookie(request, OAUTH_COOKIE), env.SESSION_SECRET);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (
    !oauth ||
    oauth.provider !== "google" ||
    oauth.exp < Date.now() / 1000 ||
    !state ||
    oauth.state !== state ||
    !code ||
    !redirectUri
  ) {
    return authErrorRedirect(request, oauth?.returnTo ?? "/portfolio/", "oauth_failed");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: oauth.verifier,
    }),
  });
  if (!tokenResponse.ok) return authErrorRedirect(request, oauth.returnTo, "oauth_failed");
  const token = await tokenResponse.json<{ access_token: string }>();
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!profileResponse.ok) return authErrorRedirect(request, oauth.returnTo, "oauth_failed");
  const profile = await profileResponse.json<{
    sub: string;
    name?: string;
    email?: string;
    picture?: string;
  }>();
  if (!profile.sub) return authErrorRedirect(request, oauth.returnTo, "oauth_failed");

  const accountId = `google:${profile.sub}`;
  const username = profile.name?.trim() || profile.email?.split("@")[0] || "Google účet";
  const avatar = profile.picture ?? null;
  const now = Math.floor(Date.now() / 1000);
  if (oauth.linkFrom) {
    const current = await session(request, env);
    if (!sameIdentity(current, oauth.linkFrom)) {
      return authErrorRedirect(request, oauth.returnTo, "link_requires_login");
    }
    const error = await linkCentralIdentity(
      request,
      oauth.linkFrom,
      env,
      "google",
      token.access_token,
    );
    if (error) return authErrorRedirect(request, oauth.returnTo, error);
    const target = new URL(safeReturnTo(oauth.returnTo), request.url);
    target.searchParams.set("account_linked", "google");
    return Response.redirect(target, 302);
  }
  await env.DB.prepare(
    `INSERT INTO users (discord_user_id, username, avatar_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(discord_user_id) DO UPDATE SET
       username = excluded.username,
       avatar_hash = excluded.avatar_hash,
       updated_at = excluded.updated_at`,
  ).bind(accountId, username, avatar, now, now).run();

  const tokenValue = await signedToken(
    {
      sub: accountId,
      username,
      avatar,
      provider: "google",
      exp: now + SESSION_SECONDS,
    },
    env.SESSION_SECRET,
  );
  const headers = new Headers({
    Location: safeReturnTo(oauth.returnTo),
    "Cache-Control": "no-store",
  });
  headers.append("Set-Cookie", setCookie(request, SESSION_COOKIE, tokenValue, SESSION_SECONDS));
  return new Response(null, { status: 302, headers });
}

async function listPortfolio(user: SessionUser, env: Env) {
  const result = await env.DB.prepare(
    `SELECT id, product_id AS productId, quantity, buy_price_czk AS buyPrice,
            buy_date AS buyDate, note, created_at AS createdAt
     FROM portfolio_items
     WHERE discord_user_id = ?
     ORDER BY buy_date DESC, id DESC`,
  ).bind(user.sub).all<{
    id: number;
    productId: string;
    quantity: number;
    buyPrice: number;
    buyDate: string;
    note: string;
    createdAt: number;
  }>();
  const items = result.results.map((item) => {
    const product = products.get(item.productId);
    return {
      ...item,
      product: product ?? {
        id: item.productId,
        name: "Produkt již není v katalogu",
        type: "",
        era: "",
        set: "",
        image: "",
        marketPrice: null,
        priceUpdatedAt: "",
      },
    };
  });
  return json({ items });
}

async function addPortfolioItem(request: Request, user: SessionUser, env: Env) {
  if (!validMutationOrigin(request)) return json({ error: "Neplatný původ požadavku." }, 403);
  let input: {
    productId?: string;
    quantity?: number;
    buyPrice?: number;
    buyDate?: string;
    note?: string;
  };
  try {
    input = await request.json();
  } catch {
    return json({ error: "Neplatná data." }, 400);
  }
  const product = products.get(String(input.productId ?? ""));
  const quantity = Number(input.quantity);
  const buyPrice = Number(input.buyPrice);
  const buyDate = String(input.buyDate ?? "");
  const note = String(input.note ?? "").trim().slice(0, 250);
  if (!product) return json({ error: "Produkt není v aktuálním katalogu." }, 400);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
    return json({ error: "Množství musí být od 1 do 999." }, 400);
  }
  if (!Number.isInteger(buyPrice) || buyPrice < 0 || buyPrice > 10_000_000) {
    return json({ error: "Nákupní cena není platná." }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(buyDate) || Number.isNaN(Date.parse(`${buyDate}T00:00:00Z`))) {
    return json({ error: "Datum nákupu není platné." }, 400);
  }
  const now = Math.floor(Date.now() / 1000);
  const inserted = await env.DB.prepare(
    `INSERT INTO portfolio_items (
       discord_user_id, product_id, quantity, buy_price_czk, buy_date, note, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(user.sub, product.id, quantity, buyPrice, buyDate, note, now, now).run();
  return json({ id: inserted.meta.last_row_id }, 201);
}

async function updatePortfolioItem(request: Request, user: SessionUser, env: Env, itemId: string) {
  if (!validMutationOrigin(request)) return json({ error: "Neplatný původ požadavku." }, 403);
  if (!/^\d+$/.test(itemId)) return json({ error: "Položka neexistuje." }, 404);
  let input: {
    quantity?: number;
    buyPrice?: number;
    buyDate?: string;
    note?: string;
  };
  try {
    input = await request.json();
  } catch {
    return json({ error: "Neplatná data." }, 400);
  }
  const quantity = Number(input.quantity);
  const buyPrice = Number(input.buyPrice);
  const buyDate = String(input.buyDate ?? "");
  const note = String(input.note ?? "").trim().slice(0, 250);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
    return json({ error: "Množství musí být od 1 do 999." }, 400);
  }
  if (!Number.isInteger(buyPrice) || buyPrice < 0 || buyPrice > 10_000_000) {
    return json({ error: "Nákupní cena není platná." }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(buyDate) || Number.isNaN(Date.parse(`${buyDate}T00:00:00Z`))) {
    return json({ error: "Datum nákupu není platné." }, 400);
  }
  const updated = await env.DB.prepare(
    `UPDATE portfolio_items
     SET quantity = ?, buy_price_czk = ?, buy_date = ?, note = ?, updated_at = ?
     WHERE id = ? AND discord_user_id = ?`,
  ).bind(
    quantity,
    buyPrice,
    buyDate,
    note,
    Math.floor(Date.now() / 1000),
    Number(itemId),
    user.sub,
  ).run();
  return updated.meta.changes
    ? json({ quantity, buyPrice, buyDate, note })
    : json({ error: "Položka neexistuje." }, 404);
}

async function deletePortfolioItem(request: Request, user: SessionUser, env: Env, itemId: string) {
  if (!validMutationOrigin(request)) return json({ error: "Neplatný původ požadavku." }, 403);
  if (!/^\d+$/.test(itemId)) return json({ error: "Položka neexistuje." }, 404);
  const deleted = await env.DB.prepare(
    "DELETE FROM portfolio_items WHERE id = ? AND discord_user_id = ?",
  ).bind(Number(itemId), user.sub).run();
  return deleted.meta.changes ? json({ ok: true }) : json({ error: "Položka neexistuje." }, 404);
}

export async function handlePortfolioApi(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return null;

  if (request.method === "GET" && url.pathname === "/api/auth/discord") {
    return beginDiscordLogin(request, env);
  }
  if (request.method === "GET" && url.pathname === "/api/auth/discord/callback") {
    return finishDiscordLogin(request, env);
  }
  if (request.method === "GET" && url.pathname === "/api/auth/google") {
    return beginGoogleLogin(request, env);
  }
  if (request.method === "GET" && url.pathname === "/api/auth/google/callback") {
    return finishGoogleLogin(request, env);
  }
  if (request.method === "POST" && url.pathname === "/api/logout") {
    if (!validMutationOrigin(request)) return json({ error: "Neplatný původ požadavku." }, 403);
    return json({ ok: true }, 200, {
      "Set-Cookie": setCookie(request, SESSION_COOKIE, "", 0),
    });
  }
  if (url.pathname === "/api/portfolio/products") {
    return centralPortfolioProductsRequest(request, env);
  }

  const user = await session(request, env);
  if (request.method === "GET" && url.pathname === "/api/session") {
    const linkedProviders = user ? await linkedCentralProviders(user, env) : [];
    return json({
      user: user
        ? {
            id: user.sub,
            username: user.username,
            avatar: user.avatar,
            provider: user.provider ?? "discord",
            linkedProviders,
          }
        : null,
    });
  }
  if (!user) return json({ error: "Pro tuto akci se nejdříve přihlas." }, 401);
  const source = portfolioDataSource(env);
  if (!["legacy", "central-readonly", "central"].includes(source)) {
    return json({ error: "Neplatný režim portfolio dat." }, 503);
  }
  if (request.method === "GET" && url.pathname === "/api/portfolio/history") {
    if (source === "legacy") {
      return json({ error: "Portfolio history requires the central database." }, 503);
    }
    return centralPortfolioRequest(request, user, env, undefined, "history");
  }
  if (request.method === "GET" && url.pathname === "/api/portfolio") {
    if (source !== "legacy") return centralPortfolioRequest(request, user, env);
    return listPortfolio(user, env);
  }
  if (request.method === "POST" && url.pathname === "/api/portfolio") {
    if (source === "central-readonly") {
      return json({ error: "Portfolio je během kontroly pouze pro čtení." }, 503);
    }
    if (source === "central") return centralPortfolioRequest(request, user, env);
    return addPortfolioItem(request, user, env);
  }
  const updateMatch = request.method === "PATCH" && url.pathname.match(/^\/api\/portfolio\/([^/]+)$/);
  if (source === "central-readonly" && updateMatch) {
    return json({ error: "Portfolio je během kontroly pouze pro čtení." }, 503);
  }
  if (source === "central" && updateMatch) {
    return centralPortfolioRequest(request, user, env, updateMatch[1]);
  }
  if (updateMatch) return updatePortfolioItem(request, user, env, updateMatch[1]);
  const deleteMatch = request.method === "DELETE" && url.pathname.match(/^\/api\/portfolio\/([^/]+)$/);
  if (source === "central-readonly" && deleteMatch) {
    return json({ error: "Portfolio je během kontroly pouze pro čtení." }, 503);
  }
  if (source === "central" && deleteMatch) {
    return centralPortfolioRequest(request, user, env, deleteMatch[1]);
  }
  if (deleteMatch) return deletePortfolioItem(request, user, env, deleteMatch[1]);

  return json({ error: "API cesta neexistuje." }, 404);
}
