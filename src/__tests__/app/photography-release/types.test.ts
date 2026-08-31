import {
  getMadridDate,
  releaseFormSchema,
} from "@/app/photography-release/types";

const signature = "data:image/png;base64,signature";

const validValues = {
  fullName: "Test Client",
  birthDate: "1990-01-01",
  documentNumber: "X1234567",
  email: "client@example.com",
  phone: "+34 600 123 456",
  sessionDate: "2026-08-30",
  usagePermissions: [],
  privacyLevel: undefined,
  signature,
};

describe("photography release schema", () => {
  it("accepts a complete private release", () => {
    const result = releaseFormSchema.safeParse(validValues);

    expect(result.success).toBe(true);
  });

  it("requires the client identity fields and signature", () => {
    const result = releaseFormSchema.safeParse({
      ...validValues,
      fullName: "",
      birthDate: "",
      documentNumber: "",
      email: "invalid",
      phone: "",
      signature: "",
    });

    expect(result.success).toBe(false);
    const issuePaths = result.success
      ? []
      : result.error.issues.map((issue) => issue.path[0]);
    expect(issuePaths).toEqual(
      expect.arrayContaining([
        "fullName",
        "birthDate",
        "documentNumber",
        "email",
        "phone",
        "signature",
      ]),
    );
  });

  it("rejects future and underage birth dates", () => {
    const future = releaseFormSchema.safeParse({
      ...validValues,
      birthDate: "2027-01-01",
    });
    const underage = releaseFormSchema.safeParse({
      ...validValues,
      birthDate: "2010-08-31",
    });

    expect(future.success).toBe(false);
    expect(underage.success).toBe(false);
    const underageMessages = underage.success
      ? []
      : underage.error.issues.map((issue) => issue.message);
    expect(underageMessages).toContain("error_age");
  });

  it("requires one privacy level for each selected usage permission", () => {
    const missingPrivacy = releaseFormSchema.safeParse({
      ...validValues,
      usagePermissions: ["social"],
    });
    const privateLevelWithoutUsage = releaseFormSchema.safeParse({
      ...validValues,
      privacyLevel: "anonymous",
    });
    const validPublicRelease = releaseFormSchema.safeParse({
      ...validValues,
      usagePermissions: ["web", "social"],
      privacyLevel: "cropped",
    });

    expect(missingPrivacy.success).toBe(false);
    expect(privateLevelWithoutUsage.success).toBe(false);
    expect(validPublicRelease.success).toBe(true);
  });

  it("formats dates in the photographer timezone", () => {
    const madridDate = getMadridDate(new Date("2026-08-29T23:30:00.000Z"));

    expect(madridDate).toBe("2026-08-30");
  });
});
