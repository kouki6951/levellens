import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiError, unexpectedApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/db";
import { generateQuestions, LlmError } from "@/lib/llm";
import type { SupportedLang } from "@/lib/levels";
import { ownerTokenHashForRequest } from "@/lib/api/ownership";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { isUuid } from "@/lib/api/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const ownerTokenHash = ownerTokenHashForRequest(request);
  if (!ownerTokenHash) return apiError("LEVEL_NOT_FOUND", "Question or completed level not found.");
  if (!isUuid(id)) return apiError("LEVEL_NOT_FOUND", "Question or completed level not found.");
  try {
  const question = await prisma.question.findFirst({
    where: { id, levelVersion: { job: { ownerTokenHash } } },
    include: { levelVersion: { include: { job: true, keyPhrases: { orderBy: { position: "asc" } } } } },
  });
  if (!question || !question.levelVersion.simplifiedText) return apiError("LEVEL_NOT_FOUND", "Question or completed level not found.");

  const rateLimit = await enforceRateLimit(request, ownerTokenHash, "regenerate");
  if (!rateLimit.allowed) {
    const response = apiError("RATE_LIMITED", "Regeneration limit reached. Please try again later.");
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

    const output = await generateQuestions(
      question.levelVersion.job.lang as SupportedLang,
      question.levelVersion.levelCode,
      question.levelVersion.simplifiedText,
      question.levelVersion.keyPhrases.map((phrase) => ({ position: phrase.position, phrase: phrase.phrase, gloss: phrase.gloss })),
      1,
      question.type as "multiple_choice" | "open_ended",
    );
    const replacement = output.questions[0];
    if (!replacement) return apiError("LLM_ERROR", "Question regeneration returned no question.");

    const linkedPhrase = question.levelVersion.keyPhrases.find((phrase) => phrase.position === replacement.keyPhrasePosition);
    const updated = await prisma.question.update({
      where: { id: question.id },
      data: {
        type: replacement.type,
        questionText: replacement.questionText,
        choices: replacement.type === "multiple_choice" ? replacement.choices : Prisma.JsonNull,
        answer: replacement.answer,
        explanation: replacement.explanation,
        keyPhraseId: linkedPhrase?.id,
      },
    });
    return NextResponse.json({
      id: updated.id,
      orderIndex: updated.orderIndex,
      type: updated.type,
      questionText: updated.questionText,
      choices: updated.choices,
      answer: updated.answer,
      explanation: updated.explanation,
      keyPhraseId: updated.keyPhraseId,
    });
  } catch (error) {
    return error instanceof LlmError ? apiError("LLM_ERROR") : unexpectedApiError(error);
  }
}
