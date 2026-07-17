import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api/errors";

function progressFor(status: string, attempt: number) {
  const stepByStatus: Record<string, string> = {
    pending: "pending",
    converting: "convert",
    verifying: "verify",
    fact_checking: "fact_check",
    key_phrases: "key_phrases",
    questions: "questions",
    completed: "completed",
    failed: "failed",
  };
  return { step: stepByStatus[status] || status, attempt, maxAttempts: Number(process.env.MAX_VERIFY_ATTEMPTS || 3) };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      levelVersions: {
        orderBy: { createdAt: "asc" },
        include: {
          verificationReport: true,
          keyPhrases: { orderBy: { position: "asc" } },
          questions: { orderBy: { orderIndex: "asc" } },
        },
      },
    },
  });

  if (!job) return apiError("JOB_NOT_FOUND");

  return Response.json({
    jobId: job.id,
    status: job.status,
    sourceTitle: job.sourceTitle,
    lang: job.lang,
    levels: job.levelVersions.map((level) => ({
      levelCode: level.levelCode,
      levelLabel: level.levelLabel,
      status: level.status,
      progress: progressFor(level.status, level.attemptCount),
      result:
        level.status === "completed"
          ? {
              simplifiedText: level.simplifiedText,
              readability: {
                metric: level.readabilityMetric,
                score: level.readabilityScore === null ? null : Number(level.readabilityScore),
                targetMin: level.targetMin === null ? null : Number(level.targetMin),
                targetMax: level.targetMax === null ? null : Number(level.targetMax),
                inRange: level.inRange,
                attemptCount: level.attemptCount,
              },
              factCheck: level.verificationReport
                ? {
                    retained: level.verificationReport.retainedCount,
                    simplified: level.verificationReport.simplifiedCount,
                    lost: level.verificationReport.lostCount,
                    items: level.verificationReport.items,
                  }
                : null,
              keyPhrases: level.keyPhrases.map((phrase) => ({
                id: phrase.id,
                position: phrase.position,
                phrase: phrase.phrase,
                charStart: phrase.charStart,
                charEnd: phrase.charEnd,
                gloss: phrase.gloss,
              })),
              questions: level.questions.map((question) => ({
                id: question.id,
                orderIndex: question.orderIndex,
                type: question.type,
                questionText: question.questionText,
                choices: question.choices,
                answer: question.answer,
                explanation: question.explanation,
                keyPhraseId: question.keyPhraseId,
              })),
            }
          : undefined,
    })),
  });
}
