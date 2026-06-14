export type CronAuthStatus = {
  authorized: boolean;
  status: 200 | 401 | 503;
  message: string;
};

export function getCronAuthStatus(headers: Headers, configuredSecret?: string): CronAuthStatus {
  const secret = configuredSecret?.trim();

  if (!secret) {
    return {
      authorized: false,
      status: 503,
      message: "Scheduled checks require CRON_SECRET.",
    };
  }

  const bearerToken = headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const headerSecret = headers.get("x-cron-secret")?.trim();

  if (bearerToken === secret || headerSecret === secret) {
    return {
      authorized: true,
      status: 200,
      message: "Authorized.",
    };
  }

  return {
    authorized: false,
    status: 401,
    message: "Invalid cron secret.",
  };
}
