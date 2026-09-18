interface CronRequest {
  headers: Pick<Headers, "get">;
}

const getBearerToken = (request: CronRequest) => {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
};

export const isCronRequestAuthorized = (request: CronRequest): boolean => {
  const configuredSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  return Boolean(
    configuredSecret && authorization === `Bearer ${configuredSecret}`,
  );
};

export const isInstagramFollowupRequestAuthorized = (
  request: CronRequest,
): boolean => {
  const configuredSecret = process.env.INSTAGRAM_FOLLOWUP_CRON_TOKEN;
  const token = getBearerToken(request);

  return Boolean(configuredSecret && token && token === configuredSecret);
};
