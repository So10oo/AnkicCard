import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CharacterCanvas } from "./CharacterCanvas";
import { AppProviders } from "./providers/AppProviders";

function renderCanvas(onChange = vi.fn()) {
  return {
    onChange,
    ...render(
      <AppProviders>
        <div style={{ width: 320, height: 320 }}>
          <CharacterCanvas value="" onChange={onChange} />
        </div>
      </AppProviders>
    ),
  };
}

function drawStroke(canvas: HTMLElement) {
  fireEvent.pointerDown(canvas, {
    clientX: 40,
    clientY: 40,
    pointerId: 1,
    pressure: 0.5,
    buttons: 1,
  });
  fireEvent.pointerMove(canvas, {
    clientX: 80,
    clientY: 90,
    pointerId: 1,
    pressure: 0.5,
    buttons: 1,
  });
  fireEvent.pointerMove(canvas, {
    clientX: 120,
    clientY: 60,
    pointerId: 1,
    pressure: 0.5,
    buttons: 1,
  });
  fireEvent.pointerUp(canvas, {
    clientX: 120,
    clientY: 60,
    pointerId: 1,
    pressure: 0,
  });
}

describe("CharacterCanvas", () => {
  it("renders canvas and disabled undo/clear initially", () => {
    renderCanvas();
    expect(screen.getByTestId("character-canvas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /отменить|undo/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /очистить|clear/i })).toBeDisabled();
  });

  it("does not throw on pointer draw and emits a data URL", async () => {
    const { onChange } = renderCanvas();
    const canvas = screen.getByTestId("character-canvas");

    expect(() => drawStroke(canvas)).not.toThrow();

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/^data:image\/png/);
  });

  it("supports undo after a stroke", async () => {
    const user = userEvent.setup();
    const { onChange } = renderCanvas();
    const canvas = screen.getByTestId("character-canvas");

    drawStroke(canvas);

    const undo = screen.getByRole("button", { name: /отменить|undo/i });
    await waitFor(() => expect(undo).toBeEnabled());
    await user.click(undo);
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("ignores clicks when getBoundingClientRect is zero-sized", () => {
    const { onChange } = renderCanvas();
    const canvas = screen.getByTestId("character-canvas") as HTMLCanvasElement;
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    });

    expect(() => {
      fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
      fireEvent.pointerUp(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
    }).not.toThrow();
    expect(onChange).not.toHaveBeenCalled();
  });
});
