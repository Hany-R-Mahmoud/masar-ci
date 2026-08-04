import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import PwaProvider from "@/components/pwa/PwaProvider";
import "@/components/pwa/PwaInstallAction.css";
import "@/components/pwa/PwaInstallPrompt.css";
import { getSiteUrl } from "@/lib/site";
import StandaloneVisitorCounter from "@/components/StandaloneVisitorCounter";
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
    images: [{ url: siteUrl ? `${siteUrl}/social-card.png` : "/social-card.png", type: "image/png", width: 1200, height: 630, alt: "MasarCI — visual GitHub Actions builder and security linter" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [{ url: siteUrl ? `${siteUrl}/social-card.png` : "/social-card.png", alt: "MasarCI — visual GitHub Actions builder and security linter" }],
  },
  icons: {
    icon: "/masar-ci.png",
    apple: "/icons/masar-ci-192.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MasarCI",
    statusBarStyle: "black-translucent",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2d2f34",
  colorScheme: "dark",
} as const;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <PwaProvider>
          {children}
          <StandaloneVisitorCounter />
          <Analytics />
        </PwaProvider>
      </body>
    </html>
  );
}
