import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/errors";
import { runInBackground } from "@/lib/background";
import { prisma } from "@/lib/db";
import { runPipelineForLevel } from "@/lib/pipeline";
import { ownerTokenHashForRequest } from "@/lib/api/ownership";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { isUuid } from "@/lib/api/validation";

export const maxDuration = 300;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const ownerTokenHash = ownerTokenHashForRequest(request);
  if (!ownerTokenHash) return apiError("LEVEL_NOT_FOUND");
  if (!isUuid(id)) return apiError("LEVEL_NOT_FOUND");
  const level = await prisma.levelVersion.findFirst({ where: { id, job: { ownerTokenHash } }, select: { id: true, status: true, inRange: true } });
  if (!level) return apiError("LEVEL_NOT_FOUND");
  if (level.status !== "failed" && !(level.status === "completed" && level.inRange === false)) {
    return apiError("LEVEL_NOT_READY", "Only failed or near-match levels can be regenerated.");
  }

  const rateLimit = await enforceRateLimit(request, ownerTokenHash, "regenerate");
  if (!rateLimit.allowed) {
    const response = apiError("RATE_LIMITED", "Regeneration limit reached. Please try again later.");
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  runInBackground(runPipelineForLevel(level.id));
  return NextResponse.json({ levelVersionId: level.id, status: "converting" }, { status: 202 });
}
