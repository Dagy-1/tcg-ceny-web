import type { Metadata } from "next";
import CatalogClient from "./CatalogClient";
import type { CatalogData } from "./catalog-model";
import catalogData from "./catalog-data.json";
import "./catalog.css";

export const metadata: Metadata = {
  title: "Katalog Pokémon TCG",
  description:
    "Porovnej aktuální ceny a skladovost Pokémon TCG produktů v českých e-shopech.",
  alternates: {
    canonical: "/katalog/",
  },
};

export default function CatalogPage() {
  return <CatalogClient data={catalogData as unknown as CatalogData} />;
}
