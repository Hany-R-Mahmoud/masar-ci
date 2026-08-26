import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CanvasChrome } from "./CanvasChrome";

vi.mock("@xyflow/react", () => ({
  Background: (props: Record<string, unknown>) => <span data-testid="canvas-background" data-gap={String(props.gap)} data-size={String(props.size)} data-color={String(props.color)} />,
  Controls: ({ className }: { readonly className?: string }) => <span data-testid="canvas-controls" className={className} />,
}));

describe("CanvasChrome", () => {
  it("locks every workspace to the Actions grid and controls", () => {
    render(<CanvasChrome />);

    expect(screen.getByTestId("canvas-background")).toHaveAttribute("data-gap", "24");
    expect(screen.getByTestId("canvas-background")).toHaveAttribute("data-size", "1");
    expect(screen.getByTestId("canvas-background")).toHaveAttribute("data-color", "var(--color-border)");
    expect(screen.getByTestId("canvas-controls")).toHaveClass("!bg-surface", "!border-border");
  });
});
