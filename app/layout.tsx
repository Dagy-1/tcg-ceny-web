import type { Metadata } from "next";
import "./globals.css";
import MotionSystem from "./MotionSystem";
import ScrollNavState from "./ScrollNavState";
import SiteTour from "./SiteTour";

export const metadata: Metadata = {
  metadataBase: new URL("https://tcgceny.cz"),
  applicationName: "TCG Ceny",
  creator: "TCG Ceny",
  publisher: "TCG Ceny",
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
    title: "TCG Ceny | Pokémon TCG na jednom místě",
    description:
      "Porovnání cen a skladovosti, ověřené alerty, historie cen a portfolio sealed sbírky.",
    images: [
      {
        url: "/tcg-ceny-social-1200x630.png",
        width: 1200,
        height: 630,
        alt: "TCG Ceny – Pokémon TCG na jednom místě",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TCG Ceny",
    description:
      "České porovnání cen a skladovosti sealed Pokémon TCG produktů.",
    images: ["/tcg-ceny-social-1200x630.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/brand-mark.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.png",
  },
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TCG Ceny",
  url: "https://tcgceny.cz/",
  inLanguage: "cs-CZ",
  description:
    "Porovnání cen a skladovosti sealed Pokémon TCG produktů v českých e-shopech.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">Přeskočit na hlavní obsah</a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c"),
          }}
        />
        <ScrollNavState />
        <MotionSystem />
        <SiteTour />
        <div id="main-content" tabIndex={-1}>{children}</div>
      </body>
    </html>
  );
}
