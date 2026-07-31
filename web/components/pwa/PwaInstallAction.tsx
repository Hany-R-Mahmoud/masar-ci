"use client";

import { cn } from "@/lib/cn";
import { usePwa } from "@/components/pwa/PwaProvider";

export function PwaInstallAction({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { shouldOfferInstall, canPromptInstall, install, openHelp } = usePwa();
  if (!shouldOfferInstall) return null;

  return (
    <button
      type="button"
      className={cn("pwa-install-action", compact && "pwa-install-action--compact", className)}
      onClick={() => void (canPromptInstall ? install() : openHelp())}
      aria-label={canPromptInstall ? "Install MasarCI" : "Open MasarCI install instructions"}
    >
      <span aria-hidden="true">＋</span>
      {compact ? "Install" : canPromptInstall ? "Install MasarCI" : "Add to device"}
    </button>
  );
}
