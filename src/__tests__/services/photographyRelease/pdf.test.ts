import { PDFDocument } from "pdf-lib";
import type { ReleaseFormValues } from "@/app/photography-release/types";
import { getReleaseCopy } from "@/services/photographyRelease/copy";
import { createPhotographyReleasePdf } from "@/services/photographyRelease/pdf";

const values: ReleaseFormValues = {
  fullName: "Марія Тест",
  birthDate: "1990-01-01",
  documentNumber: "AB123456",
  email: "client@example.com",
  phone: "+34 600 123 456",
  sessionDate: "2026-08-30",
  usagePermissions: ["web", "social"],
  privacyLevel: "anonymous",
  signature:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  agreement: true,
};

describe("photography release PDF", () => {
  it("creates a two-page Unicode PDF with the selected locale content", async () => {
    const pdfBytes = await createPhotographyReleasePdf({
      values,
      copy: getReleaseCopy("uk"),
      sessionDate: values.sessionDate,
    });
    const pdf = await PDFDocument.load(Uint8Array.from(pdfBytes));

    expect(pdf.getPageCount()).toBe(2);
    expect(pdf.getTitle()).toBe("Форма фотографічної згоди");
    expect(pdf.getPage(0).getWidth()).toBe(612);
    expect(pdf.getPage(0).getHeight()).toBe(792);
    expect(pdfBytes.byteLength).toBeGreaterThan(10000);
  });
});
