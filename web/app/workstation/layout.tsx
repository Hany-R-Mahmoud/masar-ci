import type { Metadata } from "next";
import WorkspaceSwitcher from "@/components/workbench/WorkspaceSwitcher";

export const metadata: Metadata = {
  title: "Visual DevOps Workbench",
  description: "Author and review Actions, Docker, Kubernetes, and Terraform artifacts locally in MasarCI.",
  robots: { index: false, follow: false },
};

export default function WorkstationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="workbench-root"><WorkspaceSwitcher /><div className="workbench-route">{children}</div></div>;
}
