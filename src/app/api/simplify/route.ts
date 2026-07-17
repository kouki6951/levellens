import { NextResponse } from "next/server";
import { runInBackground } from "@/lib/background";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api/errors";
import { validateSimplifyPayload } from "@/lib/api/validation";
import { levelForCode } from "@/lib/levels";
import { runPipeline } from "@/lib/pipeline";

export const maxDuration = 60;

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const validated = validateSimplifyPayload(payload);
  if (!validated.ok) return apiError(validated.code);

  const { sourceText, lang, targetLevels, options } = validated.data;
  const job = await prisma.job.create({
    data: {
      sourceText,
      lang,
      langDetected: lang,
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

  return NextResponse.json({ jobId: job.id, statusUrl: `/api/jobs/${job.id}` }, { status: 202 });
}
