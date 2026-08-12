import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://tcgceny.cz";

  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/katalog/`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/porovnani/`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/portfolio/`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/pro-eshopy/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/podminky-pouziti/`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/soukromi-a-cookies/`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
