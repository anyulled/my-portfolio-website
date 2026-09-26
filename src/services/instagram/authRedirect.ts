export const getSafeAuthReturnPath = (value: unknown): string =>
  value === "/admin/portfolio" ? "/admin/portfolio" : "/instagram";
