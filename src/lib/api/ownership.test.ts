import { describe, expect, it } from "vitest";
import { clientAddress, hashSubject, ownerSessionForRequest, ownerTokenHashForRequest } from "@/lib/api/ownership";
import { rateLimitWindowStart } from "@/lib/api/rate-limit";

describe("anonymous ownership helpers", () => {
  it("creates an HTTP-only owner cookie and reads it back as the same hash", () => {
    const session = ownerSessionForRequest(new Request("https://example.test/api/simplify"));
    expect(session.cookie).toContain("HttpOnly");
    const token = session.cookie?.match(/levellens_owner=([^;]+)/)?.[1];
    const request = new Request("https://example.test", { headers: { cookie: `levellens_owner=${token}` } });
    expect(ownerTokenHashForRequest(request)).toBe(session.tokenHash);
  });

  it("uses the first forwarded address and stable rate-limit windows", () => {
    const request = new Request("https://example.test", { headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" } });
    expect(clientAddress(request)).toBe("203.0.113.10");
    expect(hashSubject("owner:test")).toHaveLength(64);
    expect(rateLimitWindowStart(new Date("2026-07-19T12:09:59.000Z"), 600).toISOString()).toBe("2026-07-19T12:00:00.000Z");
  });
});
