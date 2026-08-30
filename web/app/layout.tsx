import type { Metadata } from "next";
// TOKEN_POLICY_BATCHED_EXECUTION
import PwaProvider from "@/components/pwa/PwaProvider";
import "@/components/pwa/PwaInstallAction.css";
import "@/components/pwa/PwaInstallPrompt.css";
import { getSiteUrl } from "@/lib/site";
import PrivacyTelemetry from "@/components/PrivacyTelemetry";
import "./globals.css";

// TOKEN_POLICY_BATCHED_EXECUTION

const siteUrl = getSiteUrl();
const siteTitle = "MasarCI — Visual DevOps Workbench";
const siteDescription =
  "Author and review Actions, Docker, Kubernetes, and Terraform artifacts locally with deterministic security evidence.";

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
    images: [{ url: siteUrl ? `${siteUrl}/social-card-v2.png` : "/social-card-v2.png", type: "image/png", width: 1200, height: 630, alt: "MasarCI visual DevOps workbench" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [{ url: siteUrl ? `${siteUrl}/social-card-v2.png` : "/social-card-v2.png", alt: "MasarCI visual DevOps workbench" }],
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
      className="h-full antialiased"
    >
      {/* TOKEN_POLICY_BATCHED_EXECUTION */}
      <body className="min-h-full">
        <PwaProvider>
          {children}
          <PrivacyTelemetry />
        </PwaProvider>
      </body>
    </html>
  );
}
// TOKEN_POLICY_BATCHED_EXECUTION
