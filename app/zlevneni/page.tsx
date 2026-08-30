import type { Metadata } from "next";
import PriceDropsClient from "./PriceDropsClient";
import "./zlevneni.css";

export const metadata: Metadata = {
  title: "Slevy a naskladnění Pokémon TCG",
  description:
    "Potvrzená zlevnění a návraty Pokémon TCG produktů do prodeje. Stejné veřejné události jako na Discordu TCG Ceny.",
  alternates: { canonical: "/zlevneni/" },
};

export default function PriceDropsPage() {
  return <PriceDropsClient />;
}
