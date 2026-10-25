import { getSafeErrorMetadata } from "@/services/portfolio/errorMetadata";

describe("getSafeErrorMetadata", () => {
  it("returns no metadata for non-object errors", () => {
    expect(getSafeErrorMetadata("Drive error")).toEqual({});
    expect(getSafeErrorMetadata(null)).toEqual({});
  });

  it("keeps only the numeric top-level status", () => {
    expect(getSafeErrorMetadata({ status: 403, token: "sensitive" })).toEqual({
      status: 403,
    });
    expect(getSafeErrorMetadata({ status: "403" })).toEqual({});
  });

  it("reads the status from a nested HTTP response", () => {
    expect(getSafeErrorMetadata({ response: { status: 502 } })).toEqual({
      status: 502,
    });
    expect(getSafeErrorMetadata({ response: null })).toEqual({});
    expect(getSafeErrorMetadata({ response: { status: "502" } })).toEqual({});
  });
});
