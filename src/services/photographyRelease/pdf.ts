import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PHOTOGRAPHER,
  ReleaseFormValues,
  UsagePermission,
} from "@/app/photography-release/types";
import type { ReleaseCopy } from "@/app/photography-release/types";
import {
  BODY_SIZE,
  BODY_COLOR,
  HEADING_COLOR,
  LEFT,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  RIGHT,
  drawCheckbox,
  drawHeader,
  drawLabelValue,
  drawRadio,
  drawSection,
  drawWrapped,
  signatureBytes,
} from "./pdfLayout";

type ReleasePdfOptions = {
  values: ReleaseFormValues;
  copy: ReleaseCopy;
  sessionDate: string;
};

export const createPhotographyReleasePdf = async ({
  values,
  copy,
  sessionDate,
}: ReleasePdfOptions): Promise<Buffer> => {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontData = await readFile(
    path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf"),
  );
  const font = await pdf.embedFont(new Uint8Array(fontData), { subset: true });
  const boldFont = font;
  const page1 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pdf.setTitle(copy.title);
  pdf.setAuthor(PHOTOGRAPHER.name);
  pdf.setSubject("Signed photography release");

  drawHeader(page1, copy, font, boldFont);
  const y0 = PAGE_HEIGHT - 102;
  drawLabelValue(
    page1,
    copy.photographer,
    PHOTOGRAPHER.name,
    LEFT,
    y0,
    font,
    boldFont,
  );
  const y1 = y0 - 16;
  drawLabelValue(
    page1,
    copy.photographerId,
    PHOTOGRAPHER.documentNumber,
    LEFT,
    y1,
    font,
    boldFont,
  );
  const y2 = y1 - 16;
  drawLabelValue(
    page1,
    copy.fullName,
    values.fullName,
    LEFT,
    y2,
    font,
    boldFont,
  );
  const y3 = y2 - 16;
  drawLabelValue(
    page1,
    copy.birthDate,
    values.birthDate,
    LEFT,
    y3,
    font,
    boldFont,
  );
  const y4 = y3 - 16;
  drawLabelValue(
    page1,
    copy.documentNumber,
    values.documentNumber,
    LEFT,
    y4,
    font,
    boldFont,
  );
  const y5 = y4 - 16;
  drawLabelValue(page1, copy.email, values.email, LEFT, y5, font, boldFont);
  const y6 = y5 - 16;
  drawLabelValue(page1, copy.phone, values.phone, LEFT, y6, font, boldFont);
  const y7 = y6 - 16;
  drawLabelValue(
    page1,
    copy.sessionDate,
    sessionDate,
    LEFT,
    y7,
    font,
    boldFont,
  );
  const y8 = y7 - 28;

  const y9 = drawSection(
    page1,
    1,
    copy.consentAndPrivacy,
    copy.consentText,
    y8,
    font,
    boldFont,
  );
  page1.drawText(`2. ${copy.imageUsage}`, {
    x: LEFT,
    y: y9,
    size: 13,
    font: boldFont,
    color: HEADING_COLOR,
  });
  const y10 =
    drawWrapped(
      page1,
      copy.imageUsageIntro,
      LEFT,
      y9 - 23,
      RIGHT - LEFT,
      font,
    ) - 4;
  const selectedUsage = new Set<UsagePermission>(values.usagePermissions);
  const usageLabels = [
    ["web", copy.usageWeb],
    ["social", copy.usageSocial],
    ["print", copy.usagePrint],
    ["magazine", copy.usageMagazine],
    ["exhibitions", copy.usageExhibitions],
  ] as const;
  usageLabels.forEach(([permission, label], index) => {
    drawCheckbox(
      page1,
      label,
      selectedUsage.has(permission),
      y10 - index * 15,
      font,
    );
  });
  const y11 = y10 - usageLabels.length * 15 - 7;
  page1.drawText(`3. ${copy.privacyLevel}`, {
    x: LEFT,
    y: y11,
    size: 13,
    font: boldFont,
    color: HEADING_COLOR,
  });
  const y12 =
    drawWrapped(page1, copy.privacyIntro, LEFT, y11 - 23, RIGHT - LEFT, font) -
    4;
  const privacyLabels = [
    ["full", copy.privacyFull],
    ["cropped", copy.privacyCropped],
    ["anonymous", copy.privacyAnonymous],
  ] as const;
  privacyLabels.forEach(([level, label], index) => {
    drawRadio(
      page1,
      label,
      values.privacyLevel === level,
      y12 - index * 15,
      font,
    );
  });

  drawHeader(page2, copy, font, boldFont);
  const y13 = PAGE_HEIGHT - 110;
  const y14 = drawSection(
    page2,
    4,
    copy.revocation,
    copy.revocationText,
    y13,
    font,
    boldFont,
  );
  const y15 = drawSection(
    page2,
    5,
    copy.liability,
    copy.liabilityText,
    y14,
    font,
    boldFont,
  );
  const y16 = drawSection(
    page2,
    6,
    copy.jurisdiction,
    copy.jurisdictionText,
    y15,
    font,
    boldFont,
  );
  page2.drawText(copy.signature, {
    x: LEFT,
    y: y16,
    size: 13,
    font: boldFont,
    color: HEADING_COLOR,
  });
  const y17 = y16 - 30;
  page2.drawText(`${copy.clientSignature}:`, {
    x: LEFT,
    y: y17,
    size: BODY_SIZE,
    font: boldFont,
    color: BODY_COLOR,
  });
  const signatureImage = await pdf.embedPng(signatureBytes(values.signature));
  const signatureScale = Math.min(
    220 / signatureImage.width,
    54 / signatureImage.height,
  );
  page2.drawImage(signatureImage, {
    x: LEFT + 112,
    y: y17 - 14,
    width: signatureImage.width * signatureScale,
    height: signatureImage.height * signatureScale,
  });
  page2.drawLine({
    start: { x: LEFT + 112, y: y17 - 17 },
    end: { x: LEFT + 360, y: y17 - 17 },
    thickness: 0.7,
    color: BODY_COLOR,
  });
  const y18 = y17 - 34;
  drawLabelValue(
    page2,
    copy.sessionDate,
    sessionDate,
    LEFT,
    y18,
    font,
    boldFont,
  );
  const y19 = y18 - 30;
  page2.drawText(`${copy.photographerSignature}: ${PHOTOGRAPHER.name}`, {
    x: LEFT,
    y: y19,
    size: BODY_SIZE,
    font,
    color: BODY_COLOR,
  });
  const y20 = y19 - 16;
  drawLabelValue(
    page2,
    copy.sessionDate,
    sessionDate,
    LEFT,
    y20,
    font,
    boldFont,
  );

  return Buffer.from(await pdf.save());
};
