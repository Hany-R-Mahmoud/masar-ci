import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workflow builder",
  description: "Build, inspect, lint, and export a GitHub Actions workflow in MasarCI.",
  robots: { index: false, follow: false },
};

export default function WorkstationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
