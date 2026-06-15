import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Manrope, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://javierpato.es"),
  title: {
    default: "Javier Pato — Diseño + Dirección creativa",
    template: "%s · Javier Pato",
  },
  description:
    "Director creativo y diseñador independiente. Branding, dirección de arte y diseño digital con criterio editorial.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Javier Pato",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${bricolage.variable} ${geist.variable} ${geistMono.variable} ${manrope.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
