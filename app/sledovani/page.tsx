import type { Metadata } from "next";
import SledovaniClient from "./SledovaniClient";
import "./sledovani.css";

export const metadata: Metadata = {
  title: "Moje sledování",
  description:
    "Přehled sledovaných Pokémon TCG produktů, cílových cen a dostupnosti na jednom místě.",
  alternates: {
    canonical: "/sledovani/",
  },
};

export default function SledovaniPage() {
  return <SledovaniClient />;
}
