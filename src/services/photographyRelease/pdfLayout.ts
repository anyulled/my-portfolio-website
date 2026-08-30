import { PDFPage, PDFFont, rgb } from "pdf-lib";
import type { ReleaseCopy } from "@/app/photography-release/types";

export const PAGE_WIDTH = 612;
export const PAGE_HEIGHT = 792;
export const LEFT = 72;
export const RIGHT = 540;
export const BODY_SIZE = 9.2;
export const BODY_LEADING = 12;
export const BODY_COLOR = rgb(0.12, 0.12, 0.12);
export const HEADING_COLOR = rgb(0.35, 0.35, 0.35);
export const ACCENT_COLOR = rgb(0.32, 0.18, 0.23);

export const wrapText = (
  text: string,
  font: PDFFont,
  size: number,
  width: number,
) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const collectLines = (
    remainingWords: string[],
    currentLine: string,
    lines: string[],
  ): string[] => {
    const [word, ...rest] = remainingWords;
    if (!word) return currentLine ? [...lines, currentLine] : lines;
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      return collectLines(rest, candidate, lines);
    }
    return collectLines(
      rest,
      word,
      currentLine ? [...lines, currentLine] : lines,
    );
  };

  return collectLines(words, "", []);
};

export const drawWrapped = (
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  font: PDFFont,
  size = BODY_SIZE,
  color = BODY_COLOR,
  leading = BODY_LEADING,
) => {
  const lines = wrapText(text, font, size, width);
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * leading,
      size,
      font,
      color,
    });
  });
  return y - lines.length * leading;
};

export const drawLabelValue = (
  page: PDFPage,
  label: string,
  value: string,
  x: number,
  y: number,
  font: PDFFont,
  boldFont: PDFFont,
) => {
  page.drawText(`${label}:`, {
    x,
    y,
    size: BODY_SIZE,
    font: boldFont,
    color: BODY_COLOR,
  });
  page.drawText(value, {
    x: x + boldFont.widthOfTextAtSize(`${label}: `, BODY_SIZE),
    y,
    size: BODY_SIZE,
    font,
    color: BODY_COLOR,
  });
};

export const drawSection = (
  page: PDFPage,
  number: number,
  title: string,
  text: string,
  y: number,
  font: PDFFont,
  boldFont: PDFFont,
) => {
  page.drawText(`${number}. ${title}`, {
    x: LEFT,
    y,
    size: 13,
    font: boldFont,
    color: HEADING_COLOR,
  });
  return drawWrapped(page, text, LEFT, y - 23, RIGHT - LEFT, font) - 9;
};

export const drawCheckbox = (
  page: PDFPage,
  label: string,
  checked: boolean,
  y: number,
  font: PDFFont,
) => {
  page.drawRectangle({
    x: LEFT,
    y: y - 2,
    width: 8,
    height: 8,
    borderWidth: 0.8,
    borderColor: BODY_COLOR,
  });
  if (checked) {
    page.drawLine({
      start: { x: LEFT + 1, y: y - 1 },
      end: { x: LEFT + 7, y: y + 5 },
      thickness: 1,
      color: ACCENT_COLOR,
    });
    page.drawLine({
      start: { x: LEFT + 1, y: y + 5 },
      end: { x: LEFT + 7, y: y - 1 },
      thickness: 1,
      color: ACCENT_COLOR,
    });
  }
  page.drawText(label, {
    x: LEFT + 14,
    y,
    size: BODY_SIZE,
    font,
    color: BODY_COLOR,
  });
};

export const drawRadio = (
  page: PDFPage,
  label: string,
  checked: boolean,
  y: number,
  font: PDFFont,
) => {
  page.drawCircle({
    x: LEFT + 4,
    y: y + 2,
    size: 4,
    borderWidth: 0.8,
    borderColor: BODY_COLOR,
  });
  if (checked) {
    page.drawCircle({
      x: LEFT + 4,
      y: y + 2,
      size: 2,
      color: ACCENT_COLOR,
    });
  }
  page.drawText(label, {
    x: LEFT + 14,
    y,
    size: BODY_SIZE,
    font,
    color: BODY_COLOR,
  });
};

export const drawHeader = (
  page: PDFPage,
  copy: Pick<ReleaseCopy, "title">,
  font: PDFFont,
  boldFont: PDFFont,
) => {
  page.drawRectangle({
    x: LEFT,
    y: PAGE_HEIGHT - 82,
    width: 48,
    height: 48,
    color: rgb(0.12, 0.12, 0.12),
  });
  page.drawText("Sensuelle", {
    x: LEFT + 4,
    y: PAGE_HEIGHT - 57,
    size: 7,
    font,
    color: rgb(0.85, 0.76, 0.58),
  });
  page.drawText("BOUDOIR", {
    x: LEFT + 8,
    y: PAGE_HEIGHT - 67,
    size: 4.5,
    font: boldFont,
    color: rgb(0.85, 0.76, 0.58),
  });
  page.drawText(copy.title.toUpperCase(), {
    x: 194,
    y: PAGE_HEIGHT - 53,
    size: 16,
    font,
    color: HEADING_COLOR,
  });
};

export const signatureBytes = (signature: string) => {
  const encoded = signature.split(",")[1];
  if (!encoded) throw new Error("Invalid signature data");
  return Uint8Array.from(Buffer.from(encoded, "base64"));
};
