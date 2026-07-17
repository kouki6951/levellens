import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { apiError } from "@/lib/api/errors";
import { prisma } from "@/lib/db";
import { WorksheetDocument, type WorksheetLevel, type WorksheetOptions } from "@/lib/pdf/worksheet";

export const runtime = "nodejs";
export const maxDuration = 60;

type ExportPayload = { jobId?: string; levelCodes?: string[]; include?: Partial<WorksheetOptions> };

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as ExportPayload | null;
  if (!payload?.jobId || !Array.isArray(payload.levelCodes) || payload.levelCodes.length === 0) return apiError("LEVELS_INVALID");

  const job = await prisma.job.findUnique({
    where: { id: payload.jobId },
    include: { levelVersions: { include: { keyPhrases: { orderBy: { position: "asc" } }, questions: { orderBy: { orderIndex: "asc" } } } } },
  });
  if (!job) return apiError("JOB_NOT_FOUND");

  const levels = job.levelVersions.filter((level) => payload.levelCodes?.includes(level.levelCode));
  if (levels.length !== payload.levelCodes.length || levels.some((level) => level.status !== "completed" || !level.simplifiedText)) {
    return apiError("LEVEL_NOT_READY");
  }

  const include: WorksheetOptions = { keyPhraseBox: true, questions: true, answerPage: true, ...payload.include };
  const worksheetLevels: WorksheetLevel[] = levels.map((level) => ({
    levelCode: level.levelCode,
    levelLabel: level.levelLabel,
    simplifiedText: level.simplifiedText!,
    keyPhrases: level.keyPhrases
      .filter((phrase) => phrase.charStart !== null && phrase.charEnd !== null)
      .map((phrase) => ({ ...phrase, charStart: phrase.charStart!, charEnd: phrase.charEnd! })),
    questions: level.questions,
  }));
  const stream = await renderToStream(React.createElement(WorksheetDocument, { title: job.sourceTitle || "LevelLens worksheet", levels: worksheetLevels, include }));
  const filename = `LevelLens_${(job.sourceTitle || "worksheet").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "worksheet"}.pdf`;

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
