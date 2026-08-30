import { SignaturePad } from "@/app/photography-release/components/SignaturePad";
import { fireEvent, render, screen } from "@testing-library/react";

const context = {
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  clearRect: jest.fn(),
  lineWidth: 0,
  lineCap: "round",
  lineJoin: "round",
  strokeStyle: "",
};

describe("SignaturePad", () => {
  beforeEach(() => {
    jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(() => context as unknown as CanvasRenderingContext2D);
    jest
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/png;base64,signature");
    jest
      .spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect")
      .mockReturnValue({
        width: 900,
        height: 240,
        top: 0,
        left: 0,
        right: 900,
        bottom: 240,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
    HTMLCanvasElement.prototype.setPointerCapture = jest.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("captures a drawn pointer signature", () => {
    const onChange = jest.fn();
    render(
      <SignaturePad
        value=""
        onChange={onChange}
        label="Client Signature"
        hint="Draw here"
        clearLabel="Clear"
      />,
    );
    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();

    fireEvent.pointerDown(canvas as HTMLCanvasElement, {
      clientX: 20,
      clientY: 20,
      pointerId: 1,
    });
    fireEvent.pointerMove(canvas as HTMLCanvasElement, {
      clientX: 80,
      clientY: 80,
      pointerId: 1,
    });
    fireEvent.pointerUp(canvas as HTMLCanvasElement, { pointerId: 1 });

    expect(onChange).toHaveBeenCalledWith("data:image/png;base64,signature");
    expect(context.stroke).toHaveBeenCalled();
  });

  it("clears a signature and reports a required error", () => {
    const onChange = jest.fn();
    render(
      <SignaturePad
        value=""
        onChange={onChange}
        label="Client Signature"
        hint="Draw here"
        clearLabel="Clear"
        error="A signature is required"
      />,
    );
    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();
    fireEvent.pointerDown(canvas as HTMLCanvasElement, {
      clientX: 20,
      clientY: 20,
      pointerId: 1,
    });
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 900, 240);
    expect(onChange).toHaveBeenLastCalledWith("");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "A signature is required",
    );
  });
});
