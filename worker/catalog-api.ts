interface CatalogApiEnv {
  CENTRAL_API_BASE_URL?: string;
}

const CATALOG_PREFIX = "/api/catalog";
const UPSTREAM_PREFIX = "/api/v1/catalog";
const REQUEST_TIMEOUT_MS = 5_000;

function jsonError(status: number, error: string): Response {
  return Response.json(
    { error },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function handleCatalogApi(
  request: Request,
  env: CatalogApiEnv,
): Promise<Response | null> {
  const requestUrl = new URL(request.url);
  if (!requestUrl.pathname.startsWith(`${CATALOG_PREFIX}/`)) return null;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonError(405, "method_not_allowed");
  }

  const baseUrl = env.CENTRAL_API_BASE_URL?.trim();
  if (!baseUrl) return jsonError(503, "central_catalog_not_configured");

  let upstreamBase: URL;
  try {
    upstreamBase = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  } catch {
    return jsonError(503, "central_catalog_invalid_configuration");
  }

  const relativePath = requestUrl.pathname.slice(CATALOG_PREFIX.length);
  const upstreamUrl = new URL(`${UPSTREAM_PREFIX}${relativePath}`, upstreamBase);
  upstreamUrl.search = requestUrl.search;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/json; charset=utf-8");
    headers.set("Cache-Control", upstream.headers.get("Cache-Control") || "public, max-age=30, stale-while-revalidate=120");
    headers.set("X-TCG-Catalog-Source", "central-api");
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch {
    return jsonError(502, "central_catalog_unavailable");
  } finally {
    clearTimeout(timeout);
  }
}
