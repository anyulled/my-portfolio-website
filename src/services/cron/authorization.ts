interface CronRequest {
  headers: Pick<Headers, "get">;
}

export const isCronRequestAuthorized = (request: CronRequest): boolean => {
  const configuredSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  return Boolean(
    configuredSecret && authorization === `Bearer ${configuredSecret}`,
  );
};
