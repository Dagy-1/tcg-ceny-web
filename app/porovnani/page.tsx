import type { Metadata } from "next";
import portfolioData from "../portfolio/portfolio-data.json";
import CompareClient from "./CompareClient";
import "./porovnani.css";

export const metadata: Metadata = {
  title: "Porovnání produktů",
  description:
    "Srovnej aktuální tržní hodnotu libovolných kombinací sealed Pokémon TCG produktů a zjisti rozdíl nebo doporučené dorovnání.",
  alternates: { canonical: "/porovnani/" },
};

export default function ComparePage() {
  return (
    <CompareClient
      initialProducts={portfolioData.products.slice(0, 12)}
      productCount={portfolioData.productCount}
      sourceUpdatedAt={portfolioData.sourceUpdatedAt}
    />
  );
}
