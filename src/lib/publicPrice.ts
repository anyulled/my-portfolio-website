export function publicPrice(
  value: number | string | null | undefined,
): number | null {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  const amount = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}
