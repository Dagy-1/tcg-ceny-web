import type { Metadata } from "next";
import PriceDropsClient from "./PriceDropsClient";
import "./zlevneni.css";

export const metadata: Metadata = {
  title: "Zlevnění Pokémon TCG",
  description:
    "Přehled potvrzených poklesů nejnižších cen Pokémon TCG produktů v českých e-shopech.",
  alternates: { canonical: "/zlevneni/" },
};

export default function PriceDropsPage() {
  return <PriceDropsClient />;
}
