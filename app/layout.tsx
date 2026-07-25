import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tcgceny.cz"),
  title: {
    default: "TCG Ceny | Ceny, skladovost a alerty Pokémon TCG",
    template: "%s | TCG Ceny",
  },
  description:
    "Porovnání cen a skladovosti sealed Pokémon TCG produktů v českých e-shopech. Alerty, historie cen a portfolio sbírky.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    url: "https://tcgceny.cz",
    siteName: "TCG Ceny",
    title: "TCG Ceny | Český Pokémon TCG market monitor",
    description:
      "Porovnání cen a skladovosti, ověřené alerty, historie cen a portfolio sealed sbírky.",
  },
  twitter: {
    card: "summary",
    title: "TCG Ceny",
    description:
      "České porovnání cen a skladovosti sealed Pokémon TCG produktů.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className={`${manrope.variable} ${spaceGrotesk.variable}`}>
        {children}
      </body>
    </html>
  );
}
