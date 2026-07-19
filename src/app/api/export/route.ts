import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { apiError } from "@/lib/api/errors";
import { prisma } from "@/lib/db";
import { worksheetLabelsFor, WorksheetDocument, type WorksheetLevel, type WorksheetOptions } from "@/lib/pdf/worksheet";
import { ownerTokenHashForRequest } from "@/lib/api/ownership";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

type ExportPayload = { jobId?: string; levelCodes?: string[]; include?: Partial<WorksheetOptions>; locale?: "en" | "es" | "ja" };

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as ExportPayload | null;
  if (!payload?.jobId || !Array.isArray(payload.levelCodes) || payload.levelCodes.length === 0) return apiError("LEVELS_INVALID");
  const ownerTokenHash = ownerTokenHashForRequest(request);
  if (!ownerTokenHash) return apiError("JOB_NOT_FOUND");

  const job = await prisma.job.findFirst({
    where: { id: payload.jobId, ownerTokenHash },
    include: { levelVersions: { include: { verificationReport: true, keyPhrases: { orderBy: { position: "asc" } }, questions: { orderBy: { orderIndex: "asc" } } } } },
  });
  if (!job) return apiError("JOB_NOT_FOUND");

  const rateLimit = await enforceRateLimit(request, ownerTokenHash, "export");
  if (!rateLimit.allowed) {
    const response = apiError("RATE_LIMITED", "Export limit reached. Please try again later.");
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  const levels = job.levelVersions.filter((level) => payload.levelCodes?.includes(level.levelCode));
  if (levels.length !== payload.levelCodes.length || levels.some((level) => level.status !== "completed" || !level.simplifiedText)) {
    return apiError("LEVEL_NOT_READY");
  }

  const include: WorksheetOptions = { keyPhraseBox: true, questions: true, answerPage: true, teacherSummary: true, ...payload.include };
  const worksheetLevels: WorksheetLevel[] = levels.map((level) => ({
    levelCode: level.levelCode,
    levelLabel: level.levelLabel,
    simplifiedText: level.simplifiedText!,
    keyPhrases: level.keyPhrases
      .filter((phrase) => phrase.charStart !== null && phrase.charEnd !== null)
      .map((phrase) => ({ ...phrase, charStart: phrase.charStart!, charEnd: phrase.charEnd! })),
    questions: level.questions,
    quality: {
      metric: level.readabilityMetric,
      score: level.readabilityScore === null ? null : Number(level.readabilityScore),
      targetMin: level.targetMin === null ? null : Number(level.targetMin),
      targetMax: level.targetMax === null ? null : Number(level.targetMax),
      retained: level.verificationReport?.retainedCount ?? null,
      simplified: level.verificationReport?.simplifiedCount ?? null,
      lost: level.verificationReport?.lostCount ?? null,
    },
  }));
  const source = job.sourceUrl ? { url: job.sourceUrl, domain: job.sourceDomain || new URL(job.sourceUrl).hostname, accessedAt: job.sourceAccessedAt?.toISOString() ?? null } : null;
  const stream = await renderToStream(React.createElement(WorksheetDocument, { title: job.sourceTitle || "LevelLens worksheet", source, levels: worksheetLevels, include, labels: worksheetLabelsFor(payload.locale ?? "en") }));
  const filename = `LevelLens_${(job.sourceTitle || "worksheet").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "worksheet"}.pdf`;

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
