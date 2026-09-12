export const isHarnessFixtureMode = (): boolean => {
  const fixtureModeEnabled = process.env.HARNESS_MODE === "fixture";

  if (fixtureModeEnabled && process.env.VERCEL_ENV === "production") {
    throw new Error(
      "Harness fixture mode cannot run in the production environment",
    );
  }

  return fixtureModeEnabled;
};
