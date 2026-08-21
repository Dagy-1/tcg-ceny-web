import type { Metadata } from "next";
import "./globals.css";
import MotionSystem from "./MotionSystem";
import ScrollNavState from "./ScrollNavState";

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
    title: "TCG Ceny | Český Pokémon TCG market monitor",
    description:
      "Porovnání cen a skladovosti, ověřené alerty, historie cen a portfolio sealed sbírky.",
    images: [
      {
        url: "/favicon.png",
        width: 1254,
        height: 1254,
        alt: "TCG Ceny",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "TCG Ceny",
    description:
      "České porovnání cen a skladovosti sealed Pokémon TCG produktů.",
    images: ["/favicon.png"],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c"),
          }}
        />
        <ScrollNavState />
        <MotionSystem />
        {children}
      </body>
    </html>
  );
}
