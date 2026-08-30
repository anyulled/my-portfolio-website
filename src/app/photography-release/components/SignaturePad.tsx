"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

interface SignaturePadProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  hint: string;
  clearLabel: string;
  error?: string;
}

export const SignaturePad = ({
  value,
  onChange,
  label,
  hint,
  clearLabel,
  error,
}: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.lineWidth = 2.2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#532e3b";
  }, []);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = getPoint(event);
    if (!canvas || !context || !point) return;

    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + 0.1, point.y + 0.1);
    context.stroke();
    setHasSignature(true);
    onChange(canvas.toDataURL("image/png"));
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = getPoint(event);
    if (!canvas || !context || !point) return;

    context.lineTo(point.x, point.y);
    context.stroke();
    onChange(canvas.toDataURL("image/png"));
  };

  const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!drawingRef.current) return;

    drawingRef.current = false;
    if (
      canvas &&
      typeof canvas.hasPointerCapture === "function" &&
      canvas.hasPointerCapture(event.pointerId)
    ) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="client-signature" className="text-sm font-medium">
          {label} *
        </label>
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          {clearLabel}
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        id="client-signature"
        width={900}
        height={240}
        aria-describedby="signature-hint signature-error"
        aria-label={label}
        className="h-48 w-full touch-none rounded-md border border-dashed border-primary bg-white"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
        onPointerLeave={stopDrawing}
      />
      <p id="signature-hint" className="text-sm text-muted-foreground">
        {hint}
      </p>
      {!hasSignature && error && (
        <p
          id="signature-error"
          role="alert"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
};
