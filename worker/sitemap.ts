import catalogData from "../app/katalog/catalog-data.json" with { type: "json" };
import { productPath, type CatalogData } from "../app/katalog/catalog-model.ts";

const routes = [
  ["/", "weekly", "1.0"],
  ["/katalog/", "daily", "0.9"],
  ["/porovnani/", "daily", "0.9"],
  ["/portfolio/", "weekly", "0.8"],
  ["/pro-eshopy/", "monthly", "0.8"],
  ["/podminky-pouziti/", "yearly", "0.3"],
  ["/soukromi-a-cookies/", "yearly", "0.3"],
] as const;

const productRoutes = (catalogData as unknown as CatalogData).products.map((product) => productPath(product));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(([path, changeFrequency, priority]) => `  <url>
    <loc>https://tcgceny.cz${path}</loc>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`).join("\n")}
${productRoutes.map((path) => `  <url>
    <loc>https://tcgceny.cz${path}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n")}
</urlset>\n`;

export function handleSitemap(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.pathname !== "/sitemap.xml") return null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD", "Cache-Control": "no-store" },
    });
  }

  return new Response(request.method === "HEAD" ? null : sitemap, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
