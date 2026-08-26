"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { migrateLegacyActionsStorage } from "@/lib/workbench/persistence";

const workspaces = [
  { href: "/workstation/actions", label: "Actions", domain: "actions" },
  { href: "/workstation/docker", label: "Docker", domain: "containers" },
  { href: "/workstation/kubernetes", label: "Kubernetes", domain: "kubernetes" },
  { href: "/workstation/terraform", label: "Terraform Review", domain: "terraform" },
] as const;

export default function WorkspaceSwitcher() {
  const pathname = usePathname();
  useEffect(() => { migrateLegacyActionsStorage(); }, []);
  return (
    <div className="workbench-productbar">
      <Link href="/workstation/actions" className="workbench-productbar__brand" aria-label="MasarCI Actions workspace">
        masar<span>·</span>ci
      </Link>
      <nav className="workspace-switcher" aria-label="DevOps workspaces">
        {workspaces.map((workspace) => {
          const current = pathname === workspace.href || (pathname === "/workstation" && workspace.domain === "actions");
          return <Link key={workspace.href} href={workspace.href} data-domain={workspace.domain} aria-current={current ? "page" : undefined}>{workspace.label}</Link>;
        })}
      </nav>
      <span className="workbench-local-badge">Local only</span>
    </div>
  );
}
