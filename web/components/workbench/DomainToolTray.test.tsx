import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DomainToolTray } from "@/components/workbench/DomainToolTray";

describe("DomainToolTray", () => {
  it("adds an authoring tool from keyboard-equivalent click", () => {
    // Given
    const onAddTool = vi.fn();
    render(<DomainToolTray domain="compose" activeLens="all" onAddTool={onAddTool} onSelectLens={vi.fn()} />);

    // When
    fireEvent.click(screen.getByRole("button", { name: "Add Service to canvas" }));

    // Then
    expect(onAddTool).toHaveBeenCalledWith("compose-service");
  });

  it("selects a Terraform review lens without exposing authoring tools", () => {
    // Given
    const onSelectLens = vi.fn();
    render(<DomainToolTray domain="terraform" activeLens="all" onAddTool={vi.fn()} onSelectLens={onSelectLens} />);

    // When
    fireEvent.click(screen.getByRole("button", { name: "Focus Replacements" }));

    // Then
    expect(onSelectLens).toHaveBeenCalledWith("replace");
    expect(screen.queryByText("Drag onto canvas")).not.toBeInTheDocument();
  });
});
