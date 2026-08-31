import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFPage, PDFFont } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  BODY_COLOR,
  BODY_LEADING,
  BODY_SIZE,
  HEADING_COLOR,
  LEFT,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  RIGHT,
  drawHeader,
  drawLabelValue,
  drawWrapped,
  signatureBytes,
  wrapText,
} from "../photographyRelease/pdfLayout";
import {
  ModelReleaseCopy,
  ModelReleaseFormValues,
  PHOTOGRAPHER,
  RELEASE_LOCATION,
} from "@/app/model-release/types";

type ModelReleasePdfOptions = {
  values: ModelReleaseFormValues;
  copy: ModelReleaseCopy;
  releaseDate: string;
};

const drawFlowBlock = (
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size = BODY_SIZE,
  leading = BODY_LEADING,
) =>
  drawWrapped(
    page,
    text,
    LEFT,
    y,
    RIGHT - LEFT,
    font,
    size,
    BODY_COLOR,
    leading,
  );

const drawClause = (
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
  return drawFlowBlock(page, text, y - 23, font) - 9;
};

const drawSignature = async (
  pdf: PDFDocument,
  page: PDFPage,
  copy: ModelReleaseCopy,
  values: ModelReleaseFormValues,
  releaseDate: string,
  y: number,
  font: PDFFont,
  boldFont: PDFFont,
) => {
  page.drawText(copy.signature, {
    x: LEFT,
    y,
    size: 13,
    font: boldFont,
    color: HEADING_COLOR,
  });
  const labelY = y - 30;
  page.drawText(`${copy.modelSignature}:`, {
    x: LEFT,
    y: labelY,
    size: BODY_SIZE,
    font: boldFont,
    color: BODY_COLOR,
  });
  const signatureImage = await pdf.embedPng(signatureBytes(values.signature));
  const signatureScale = Math.min(
    220 / signatureImage.width,
    54 / signatureImage.height,
  );
  page.drawImage(signatureImage, {
    x: LEFT + 112,
    y: labelY - 14,
    width: signatureImage.width * signatureScale,
    height: signatureImage.height * signatureScale,
  });
  page.drawLine({
    start: { x: LEFT + 112, y: labelY - 17 },
    end: { x: LEFT + 360, y: labelY - 17 },
    thickness: 0.7,
    color: BODY_COLOR,
  });
  drawLabelValue(
    page,
    copy.releaseDate,
    releaseDate,
    LEFT,
    labelY - 34,
    font,
    boldFont,
  );
  page.drawText(`${copy.photographerSignature}: ${PHOTOGRAPHER.name}`, {
    x: LEFT,
    y: labelY - 64,
    size: BODY_SIZE,
    font,
    color: BODY_COLOR,
  });
  drawLabelValue(
    page,
    copy.location,
    RELEASE_LOCATION,
    LEFT,
    labelY - 80,
    font,
    boldFont,
  );
};

export const createModelReleasePdf = async ({
  values,
  copy,
  releaseDate,
}: ModelReleasePdfOptions): Promise<Buffer> => {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontData = await readFile(
    path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf"),
  );
  const font = await pdf.embedFont(new Uint8Array(fontData), { subset: true });
  const boldFont = font;
  const logoFontData = await readFile(
    path.join(process.cwd(), "public", "fonts", "DancingScript-Variable.ttf"),
  );
  const logoFont = await pdf.embedFont(new Uint8Array(logoFontData), {
    subset: true,
  });
  pdf.setTitle(copy.title);
  pdf.setAuthor(PHOTOGRAPHER.name);
  pdf.setSubject("Signed model release");

  const state = {
    page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - 110,
  };
  drawHeader(state.page, copy, font, logoFont);
  const nextPage = () => {
    state.page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawHeader(state.page, copy, font, logoFont);
    state.y = PAGE_HEIGHT - 110;
  };
  const drawField = (label: string, value: string) => {
    drawLabelValue(
      state.page,
      label,
      value || "-",
      LEFT,
      state.y,
      font,
      boldFont,
    );
    state.y -= 16;
  };

  drawField(copy.fullName, values.fullName);
  drawField(copy.birthDate, values.birthDate);
  drawField(copy.documentNumber, values.documentNumber);
  drawField(copy.email, values.email);
  drawField(copy.phone, values.phone);
  drawField(copy.gender, values.gender);
  drawField(copy.address, values.address);
  drawField(copy.city, values.city);
  drawField(copy.state, values.state);
  drawField(copy.country, values.country);
  drawField(copy.postalCode, values.postalCode);
  state.y -= 8;
  state.page.drawText(copy.releaseDetails, {
    x: LEFT,
    y: state.y,
    size: 13,
    font: boldFont,
    color: HEADING_COLOR,
  });
  state.y -= 24;
  drawField(copy.photographer, PHOTOGRAPHER.name);
  drawField(copy.photographerId, PHOTOGRAPHER.documentNumber);
  drawField(copy.releaseDate, releaseDate);
  drawField(copy.location, RELEASE_LOCATION);
  state.y -= 8;
  state.y = drawFlowBlock(state.page, copy.preamble, state.y, font) - 12;

  copy.clauses.forEach((clause, index) => {
    const lines = wrapText(clause.text, font, BODY_SIZE, RIGHT - LEFT);
    if (state.y - 28 - lines.length * BODY_LEADING < 68) nextPage();
    state.y = drawClause(
      state.page,
      index + 1,
      clause.title,
      clause.text,
      state.y,
      font,
      boldFont,
    );
  });

  if (state.y < 160) nextPage();
  await drawSignature(
    pdf,
    state.page,
    copy,
    values,
    releaseDate,
    state.y,
    font,
    boldFont,
  );

  return Buffer.from(await pdf.save());
};
