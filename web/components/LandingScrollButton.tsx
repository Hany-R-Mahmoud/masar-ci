"use client";

import type { ReactNode } from "react";

type LandingScrollButtonProps = {
  targetId: string;
  className: string;
  children: ReactNode;
};

export function LandingScrollButton({ targetId, className, children }: LandingScrollButtonProps) {
  function handleClick() {
    const target = document.getElementById(targetId);
    if (!target) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <button type="button" className={className} onClick={handleClick} aria-controls={targetId}>
      {children}
    </button>
  );
}
