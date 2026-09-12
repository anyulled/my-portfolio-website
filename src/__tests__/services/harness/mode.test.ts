import { isHarnessFixtureMode } from "@/services/harness/mode";

describe("Harness fixture mode", () => {
  const originalHarnessMode = process.env.HARNESS_MODE;
  const originalVercelEnvironment = process.env.VERCEL_ENV;

  afterEach(() => {
    if (originalHarnessMode === undefined) {
      delete process.env.HARNESS_MODE;
    } else {
      process.env.HARNESS_MODE = originalHarnessMode;
    }

    if (originalVercelEnvironment === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnvironment;
    }
  });

  it("is disabled unless explicitly selected", () => {
    delete process.env.HARNESS_MODE;

    const enabled = isHarnessFixtureMode();

    expect(enabled).toBe(false);
  });

  it("is enabled outside production", () => {
    process.env.HARNESS_MODE = "fixture";
    process.env.VERCEL_ENV = "preview";

    const enabled = isHarnessFixtureMode();

    expect(enabled).toBe(true);
  });

  it("fails closed in production", () => {
    process.env.HARNESS_MODE = "fixture";
    process.env.VERCEL_ENV = "production";

    expect(() => isHarnessFixtureMode()).toThrow(
      "Harness fixture mode cannot run in the production environment",
    );
  });
});
