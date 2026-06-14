import { describe, expect, it } from "vitest";
import { getDaysUntilExpiry, normalizeDomainName, validateDomainName } from "./domain-utils";

describe("domain utils", () => {
  it("normalizes URLs into root domain names", () => {
    expect(normalizeDomainName(" https://www.PinkPixel.dev/projects ")).toBe("pinkpixel.dev");
  });

  it("accepts a normal domain", () => {
    expect(validateDomainName("pinkpixel.dev")).toEqual({ valid: true });
  });

  it("rejects an invalid domain", () => {
    expect(validateDomainName("not a domain")).toEqual({
      valid: false,
      error: "Enter a valid domain like example.com.",
    });
  });

  it("counts whole days until expiry from a UTC day boundary", () => {
    expect(getDaysUntilExpiry("2026-07-13", new Date("2026-06-13T12:00:00Z"))).toBe(30);
  });
});
