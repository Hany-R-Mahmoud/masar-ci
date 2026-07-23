import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkflowTabs } from "@/components/WorkflowTabs";

const tabs = [
  { id: "build", name: "build", dirty: false },
  { id: "deploy", name: "deploy", dirty: true },
];

describe("WorkflowTabs", () => {
  it("exposes roving tab semantics and arrow navigation", () => {
    const onSelect = vi.fn();
    render(<WorkflowTabs tabs={tabs} activeId="build" onSelect={onSelect} onClose={vi.fn()} onNew={vi.fn()} />);

    const build = screen.getByRole("tab", { name: "build" });
    const deploy = screen.getByRole("tab", { name: /deploy$/ });
    expect(build).toHaveAttribute("aria-controls", "workflow-workspace-panel");
    expect(build).toHaveAttribute("aria-selected", "true");
    expect(build).toHaveAttribute("tabindex", "0");
    expect(deploy).toHaveAttribute("tabindex", "-1");

    fireEvent.keyDown(build, { key: "ArrowRight" });
    expect(onSelect).toHaveBeenCalledWith("deploy");
  });
});
