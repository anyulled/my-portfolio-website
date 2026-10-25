const getNumericStatus = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isInteger(value) ? value : undefined;

export const getSafeErrorMetadata = (error: unknown): { status?: number } => {
  if (typeof error !== "object" || error === null) {
    return {};
  }

  if ("status" in error) {
    const status = getNumericStatus(error.status);
    if (status !== undefined) {
      return { status };
    }
  }

  if (
    !("response" in error) ||
    typeof error.response !== "object" ||
    error.response === null ||
    !("status" in error.response)
  ) {
    return {};
  }

  const status = getNumericStatus(error.response.status);
  return status === undefined ? {} : { status };
};
