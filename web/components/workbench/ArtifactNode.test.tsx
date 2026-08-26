import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArtifactNode } from "./ArtifactNode";

vi.mock("@xyflow/react", () => ({
  Handle: ({ type }: { readonly type: string }) => <span data-testid={`${type}-handle`} />,
  Position: { Top: "top", Bottom: "bottom" },
}));

describe("ArtifactNode", () => {
  it("uses the production Actions node anatomy", () => {
    render(<ArtifactNode data={{ kind: "service", label: "api", detail: "node:22-alpine" }} selected={false} />);

    const node = screen.getByRole("group", { name: "service api: node:22-alpine" });
    expect(node).toHaveClass("rounded-lg", "border-border-strong", "bg-surface-2", "p-3");
    expect(screen.getByText("api")).toBeVisible();
    expect(screen.getByText("node:22-alpine")).toBeVisible();
    expect(screen.getByTestId("target-handle")).toBeInTheDocument();
    expect(screen.getByTestId("source-handle")).toBeInTheDocument();
  });
});
