import type { Metadata } from "next";
import { notFound } from "next/navigation";
import catalogData from "../../katalog/catalog-data.json";
import { productPath, productSlug, type CatalogData, type Product } from "../../katalog/catalog-model";
import ProductPageClient from "./ProductPageClient";
import "../../katalog/catalog.css";
import "./product.css";

const catalog = catalogData as unknown as CatalogData;

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.products.map((product) => ({ slug: productSlug(product) }));
}

function findProduct(slug: string): Product | undefined {
  return catalog.products.find((product) => productSlug(product) === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return {};
  const price = product.bestPrice === null
    ? "Aktuální cena není dostupná."
    : `Nejlepší dostupná cena je ${new Intl.NumberFormat("cs-CZ").format(product.bestPrice)} Kč.`;
  const description = `${price} Porovnej nabídky českých e-shopů pro ${product.name}.`;
  const canonical = productPath(product);
  return {
    title: `${product.name} – cena a skladovost`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${product.name} | TCG Ceny`,
      description,
      url: canonical,
      type: "website",
      images: product.image ? [{ url: product.image, alt: product.name }] : undefined,
    },
    twitter: { card: "summary_large_image", title: `${product.name} | TCG Ceny`, description, images: product.image ? [product.image] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  const availableOffers = product.offers.filter((offer) => offer.status !== "unavailable" && !offer.stale && offer.price !== null);
  const canonical = `https://tcgceny.cz${productPath(product)}`;
  const image = product.image
    ? product.image.startsWith("https://") ? product.image : `https://tcgceny.cz${product.image}`
    : undefined;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: image ? [image] : undefined,
    category: `Pokémon TCG ${product.type}`,
    url: canonical,
    offers: availableOffers.length ? {
      "@type": "AggregateOffer",
      priceCurrency: "CZK",
      lowPrice: Math.min(...availableOffers.map((offer) => offer.price as number)),
      offerCount: availableOffers.length,
      availability: product.availability === "online" ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability",
    } : undefined,
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <ProductPageClient initialProduct={product} />
  </>;
}
