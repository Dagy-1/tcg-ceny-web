import type { Metadata } from "next";
import CatalogClient, { type CatalogData } from "./CatalogClient";
import catalogData from "./catalog-data.json";
import "./catalog.css";

export const metadata: Metadata = {
  title: "Katalog Pokémon TCG",
  description:
    "Porovnej ceny a skladovost 178 zapečetěných Pokémon TCG produktů v českých e-shopech.",
  alternates: {
    canonical: "/katalog/",
  },
};

export default function CatalogPage() {
  return <CatalogClient data={catalogData as unknown as CatalogData} />;
}
