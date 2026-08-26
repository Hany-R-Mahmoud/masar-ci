"use client";

import { Analytics } from "@vercel/analytics/react";
import { usePathname } from "next/navigation";
import StandaloneVisitorCounter from "@/components/StandaloneVisitorCounter";

export default function PrivacyTelemetry() {
  const pathname = usePathname();
  if (pathname.startsWith("/workstation")) return null;
  return <><StandaloneVisitorCounter /><Analytics /></>;
}
