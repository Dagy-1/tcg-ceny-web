/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { handlePortfolioApi } from "./portfolio-api";
import { handleCatalogApi } from "./catalog-api";
import { canonicalHostRedirect } from "./canonical-host";
import { handleProductImage } from "./product-image";
import { handleSitemap } from "./sitemap";

interface Env {
  ASSETS: Fetcher;
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
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https://pokemonproductimages.pokedata.io https://cdn.discordapp.com https://lh3.googleusercontent.com",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "upgrade-insecure-requests",
].join("; ");

function withSecurityHeaders(response: Response, isHttps: boolean): Response {
  const headers = new Headers(response.headers);

  headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=(), usb=()");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set("X-Frame-Options", "DENY");

  if (isHttps) {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const canonicalResponse = canonicalHostRedirect(request);
    if (canonicalResponse) {
      return withSecurityHeaders(canonicalResponse, url.protocol === "https:");
    }

    const productImageResponse = await handleProductImage(request);
    if (productImageResponse) {
      return withSecurityHeaders(productImageResponse, url.protocol === "https:");
    }

    const sitemapResponse = handleSitemap(request);
    if (sitemapResponse) {
      return withSecurityHeaders(sitemapResponse, url.protocol === "https:");
    }

    const catalogResponse = await handleCatalogApi(request, env);
    if (catalogResponse) {
      return withSecurityHeaders(catalogResponse, url.protocol === "https:");
    }

    const apiResponse = await handlePortfolioApi(request, env);
    if (apiResponse) {
      return withSecurityHeaders(apiResponse, url.protocol === "https:");
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return withSecurityHeaders(response, url.protocol === "https:");
    }

    const response = await handler.fetch(request, env, ctx);
    return withSecurityHeaders(response, url.protocol === "https:");
  },
};

export default worker;
