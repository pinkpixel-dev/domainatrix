import { describe, expect, it } from "vitest";
import { getCronAuthStatus } from "./cron-auth";

describe("cron auth", () => {
  it("rejects cron requests when no secret is configured", () => {
    expect(getCronAuthStatus(new Headers(), undefined)).toEqual({
      authorized: false,
      status: 503,
      message: "Scheduled checks require CRON_SECRET.",
    });
  });

  it("accepts a bearer token that matches the configured secret", () => {
    const headers = new Headers({ authorization: "Bearer super-secret" });

    expect(getCronAuthStatus(headers, "super-secret")).toEqual({
      authorized: true,
      status: 200,
      message: "Authorized.",
    });
  });

  it("rejects missing or incorrect cron secrets", () => {
    const headers = new Headers({ authorization: "Bearer wrong-secret" });

    expect(getCronAuthStatus(headers, "super-secret")).toMatchObject({
      authorized: false,
      status: 401,
    });
  });
});
