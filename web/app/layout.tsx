import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl = getSiteUrl();
const siteTitle = "MasarCI — Visual GitHub Actions Builder & Security Linter";
const siteDescription =
  "Build GitHub Actions workflows visually and lint them for security anti-patterns before they reach production.";

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: { default: siteTitle, template: "%s · MasarCI" },
  description: siteDescription,
  alternates: siteUrl ? { canonical: siteUrl } : undefined,
  openGraph: {
    type: "website",
    siteName: "MasarCI",
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    images: [{ url: siteUrl ? `${siteUrl}/masar-ci.png` : "/masar-ci.png", width: 1024, height: 1024, alt: "MasarCI logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [siteUrl ? `${siteUrl}/masar-ci.png` : "/masar-ci.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
