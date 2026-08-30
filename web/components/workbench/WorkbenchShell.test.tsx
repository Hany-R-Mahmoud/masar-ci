import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorkbenchShell } from "@/components/workbench/WorkbenchShell";

describe("WorkbenchShell", () => {
  it("renders tools, canvas, and source as simultaneous workspace regions", () => {
    // Given
    const tools = <div>Domain tools</div>;
    const canvas = <div>Interactive canvas</div>;
    const inspector = <div>Generated source</div>;

    // When
    render(<WorkbenchShell tools={tools} canvas={canvas} inspector={inspector} />);

    // Then
    expect(screen.getByRole("complementary", { name: "Workspace tools" })).toHaveTextContent("Domain tools");
    expect(screen.getByRole("main", { name: "Visual canvas" })).toHaveTextContent("Interactive canvas");
    expect(screen.getByRole("complementary", { name: "Source and findings" })).toHaveTextContent("Generated source");
  });

  it("supports keyboard resizing from the accessible separator", async () => { // TOKEN_POLICY_BATCHED_EXECUTION
    render(<WorkbenchShell tools={<div />} canvas={<div />} inspector={<div />} />);

    const separator = screen.getByRole("separator", { name: "Resize source and findings panel" });
    await waitFor(() => expect(separator).toHaveAttribute("aria-valuenow"));
    const before = Number(separator.getAttribute("aria-valuenow"));

    fireEvent.keyDown(separator, { key: "ArrowLeft" });

    await waitFor(() => expect(separator).toHaveAttribute("aria-valuenow", String(before + 16)));
  });
});
