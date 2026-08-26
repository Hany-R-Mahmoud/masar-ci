"use client";

import { useEffect } from "react";

// TOKEN_POLICY_BATCHED_EXECUTION: normalize legacy landing fragments.

const LANDING_ANCHORS = new Set(["workspaces", "journey"]);

export function LandingHashCleanup() {
  useEffect(() => {
    function normalizeLandingHash() {
      const hash = window.location.hash.slice(1);
      if (!LANDING_ANCHORS.has(hash)) return;

      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      document.getElementById(hash)?.scrollIntoView({ behavior: "auto", block: "start" });
    }

    normalizeLandingHash();
    window.addEventListener("hashchange", normalizeLandingHash);
    return () => window.removeEventListener("hashchange", normalizeLandingHash);
  }, []);

  return null;
}
