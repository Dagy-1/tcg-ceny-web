import type { Metadata } from "next";
import portfolioData from "./portfolio-data.json";
import PortfolioClient from "./PortfolioClient";
import "./portfolio.css";

export const metadata: Metadata = {
  title: "Moje portfolio",
  description:
    "Ulož si sealed Pokémon TCG produkty, sleduj vloženou částku, aktuální hodnotu a vývoj své sbírky.",
  alternates: {
    canonical: "/portfolio/",
  },
};

export default function PortfolioPage() {
  return (
    <PortfolioClient
      products={portfolioData.products.slice(0, 8)}
      productCount={portfolioData.productCount}
      sourceUpdatedAt={portfolioData.sourceUpdatedAt}
    />
  );
}
