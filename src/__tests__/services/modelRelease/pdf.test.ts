import { PDFDocument } from "pdf-lib";
import { getModelReleaseCopy } from "@/services/modelRelease/copy";
import { createModelReleasePdf } from "@/services/modelRelease/pdf";
import type { ModelReleaseFormValues } from "@/app/model-release/types";

const values: ModelReleaseFormValues = {
  fullName: "Марія Тест",
  birthDate: "1990-01-01",
  documentNumber: "AB123456",
  email: "model@example.com",
  phone: "+34 600 123 456",
  gender: "",
  address: "Carrer de la Prova 1",
  city: "Barcelona",
  state: "Barcelona",
  country: "Spain",
  postalCode: "08001",
  signature:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
};

describe("model release PDF", () => {
  it("creates a readable single-column multi-page Unicode PDF", async () => {
    const pdfBytes = await createModelReleasePdf({
      values,
      copy: getModelReleaseCopy("uk"),
      releaseDate: "2026-08-31",
    });
    const pdf = await PDFDocument.load(Uint8Array.from(pdfBytes));

    expect(pdf.getPageCount()).toBeGreaterThan(1);
    expect(pdf.getTitle()).toBe("Згода моделі");
    expect(pdf.getAuthor()).toBe("Anyul Led Rivas Oropeza");
    expect(pdf.getPage(0).getWidth()).toBe(612);
    expect(pdf.getPage(0).getHeight()).toBe(792);
    expect(pdfBytes.byteLength).toBeGreaterThan(10000);
  });
});
