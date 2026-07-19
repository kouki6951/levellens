import { NextResponse } from "next/server";
import { runInBackground } from "@/lib/background";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api/errors";
import { validateSimplifyPayload } from "@/lib/api/validation";
import { levelForCode } from "@/lib/levels";
import { runPipeline } from "@/lib/pipeline";
import { addOwnerCookie, ownerSessionForRequest } from "@/lib/api/ownership";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export const maxDuration = 60;

export async function POST(request: Request) {
  const ownerSession = ownerSessionForRequest(request);
  const payload = await request.json().catch(() => null);
  const validated = validateSimplifyPayload(payload);
  if (!validated.ok) return addOwnerCookie(apiError(validated.code), ownerSession);

  const rateLimit = await enforceRateLimit(request, ownerSession.tokenHash, "simplify");
  if (!rateLimit.allowed) {
    const response = apiError("RATE_LIMITED", "Conversion limit reached. Please try again later.");
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return addOwnerCookie(response, ownerSession);
  }

  const { sourceText, lang, targetLevels, options, source } = validated.data;
  const job = await prisma.job.create({
    data: {
      sourceText,
      sourceTitle: source?.title || null,
      sourceUrl: source?.url || null,
      sourceDomain: source?.domain || null,
      sourceAccessedAt: source ? new Date(source.accessedAt) : null,
      lang,
      langDetected: lang,
      ownerTokenHash: ownerSession.tokenHash,
      options,
      levelVersions: {
        create: targetLevels.map((levelCode) => {
          const level = levelForCode(levelCode);
          if (!level) throw new Error(`Unknown level: ${levelCode}`);
          return {
            levelCode,
            levelLabel: level.label,
            targetMin: level.targetMin,
            targetMax: level.targetMax,
            readabilityMetric: level.metric,
          };
        }),
      },
    },
  });

  runInBackground(runPipeline(job.id));

  return addOwnerCookie(NextResponse.json({ jobId: job.id, statusUrl: `/api/jobs/${job.id}` }, { status: 202 }), ownerSession);
}
