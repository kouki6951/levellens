import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { clientAddress, hashSubject } from "@/lib/api/ownership";

export type RateLimitPolicy = { windowSeconds: number; maxRequests: number };

export const RATE_LIMIT_POLICIES = {
  detect: [{ windowSeconds: 5 * 60, maxRequests: 300 }, { windowSeconds: 24 * 60 * 60, maxRequests: 5_000 }],
  simplify: [{ windowSeconds: 10 * 60, maxRequests: 2 }, { windowSeconds: 24 * 60 * 60, maxRequests: 8 }],
  import: [{ windowSeconds: 10 * 60, maxRequests: 5 }, { windowSeconds: 24 * 60 * 60, maxRequests: 20 }],
  regenerate: [{ windowSeconds: 10 * 60, maxRequests: 4 }, { windowSeconds: 24 * 60 * 60, maxRequests: 20 }],
  export: [{ windowSeconds: 10 * 60, maxRequests: 8 }, { windowSeconds: 24 * 60 * 60, maxRequests: 30 }],
} satisfies Record<string, RateLimitPolicy[]>;

export function rateLimitWindowStart(now: Date, windowSeconds: number) {
  return new Date(Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000);
}

function keyFor(scope: string, subjectHash: string, windowStart: Date) {
  return createHash("sha256").update(`${scope}:${subjectHash}:${windowStart.toISOString()}`).digest("hex");
}

export async function enforceRateLimit(request: Request, ownerTokenHash: string, scope: keyof typeof RATE_LIMIT_POLICIES, now = new Date()) {
  // Local development needs repeated manual checks without consuming shared production-style quotas.
  if (process.env.NODE_ENV !== "production") return { allowed: true, retryAfterSeconds: 0 };

  const subjects = [hashSubject(`owner:${ownerTokenHash}`), hashSubject(`ip:${clientAddress(request)}`)];
  let retryAfterSeconds = 0;

  for (const policy of RATE_LIMIT_POLICIES[scope]) {
    const windowStart = rateLimitWindowStart(now, policy.windowSeconds);
    for (const subjectHash of subjects) {
      const row = await prisma.rateLimitWindow.upsert({
        where: { id: keyFor(`${scope}:${policy.windowSeconds}`, subjectHash, windowStart) },
        create: { id: keyFor(`${scope}:${policy.windowSeconds}`, subjectHash, windowStart), scope: `${scope}:${policy.windowSeconds}`, subjectHash, windowStart, count: 1 },
        update: { count: { increment: 1 } },
      });
      if (row.count > policy.maxRequests) retryAfterSeconds = Math.max(retryAfterSeconds, policy.windowSeconds - Math.floor((now.getTime() - windowStart.getTime()) / 1000));
    }
  }

  return { allowed: retryAfterSeconds === 0, retryAfterSeconds };
}
