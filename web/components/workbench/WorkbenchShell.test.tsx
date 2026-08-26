import { render, screen } from "@testing-library/react";
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
});
