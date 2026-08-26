import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DomainWorkspace from "@/components/workbench/DomainWorkspace";

vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children }: { readonly children?: ReactNode }) => <div data-testid="domain-flow">{children}</div>,
  Background: () => null,
  Controls: () => null,
  MarkerType: { ArrowClosed: "arrowclosed" },
}));

describe("DomainWorkspace", () => {
  beforeEach(() => localStorage.clear());

  it("exposes artifact identity and workspace status in the operational header", () => {
    render(<DomainWorkspace domain="compose" title="Docker workbench" description="Compose authoring" artifactName="compose.yaml" />);

    expect(screen.getByRole("textbox", { name: "Artifact name" })).toHaveValue("compose.yaml");
    expect(screen.getByRole("status")).toHaveTextContent("Example loaded · not yet saved");
    expect(screen.getByRole("button", { name: "Analyze & save" })).toBeEnabled();
  });

  it("keeps source visible while a canvas tool updates valid source", () => {
    // Given
    render(<DomainWorkspace domain="compose" title="Docker workbench" description="Compose authoring" artifactName="compose.yaml" />);
    const source = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Compose source" });

    // When
    fireEvent.click(screen.getByRole("button", { name: "Add Service to canvas" }));

    // Then
    expect(screen.getByRole("main", { name: "Visual canvas" })).toContainElement(screen.getByTestId("domain-flow"));
    expect(source.value).toContain("  service:\n");
    expect(source).toBeVisible();
  });

  it("clears stale analysis and disables export after an invalid edit", () => {
    render(<DomainWorkspace domain="compose" title="Docker workbench" description="Compose authoring" artifactName="compose.yaml" />);
    const source = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Compose source" });

    fireEvent.change(source, { target: { value: "services: [" } });

    expect(screen.getByRole("button", { name: "Export" })).toBeDisabled();
    expect(screen.getByText("Correct or import source to begin review.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/Source invalid/);
  });
});
