import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { levelForCode, type SupportedLang } from "@/lib/levels";
import { buildRevisionFeedback, extractKeyPhrases, factCheckText, generateQuestions, simplifyText } from "@/lib/llm";
import { scorerFor } from "@/lib/readability";

const DEFAULT_MAX_VERIFY_ATTEMPTS = 3;

type PipelineOptions = {
  questionCount: 0 | 3 | 5;
  questionType: "multiple_choice" | "open_ended";
  glossEnabled: boolean;
};

function maxVerifyAttempts() {
  const parsed = Number(process.env.MAX_VERIFY_ATTEMPTS || DEFAULT_MAX_VERIFY_ATTEMPTS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_VERIFY_ATTEMPTS;
}

async function logEvent(jobId: string, levelCode: string | null, event: string, detail?: Prisma.InputJsonValue) {
  await prisma.jobEvent.create({ data: { jobId, levelCode, event, detail } });
}

type KeyPhraseOffset = {
  phrase: string;
  charStart: number;
  charEnd: number;
};

function validateKeyPhrases(text: string, phrases: KeyPhraseOffset[]) {
  return phrases.length === 3 && phrases.every((item) => text.slice(item.charStart, item.charEnd) === item.phrase);
}

/**
 * LLMs occasionally count character positions differently around accented or
 * non-ASCII text. Only repair positions when the returned phrase occurs in the
 * text exactly; otherwise keep the validation failure.
 */
export function repairKeyPhraseOffsets<T extends KeyPhraseOffset>(text: string, phrases: T[]): T[] | null {
  if (phrases.length !== 3) return null;

  const occupied: Array<{ start: number; end: number }> = [];
  const repaired: T[] = [];

  for (const phrase of phrases) {
    if (!phrase.phrase) return null;

    const occurrences: number[] = [];
    for (let index = text.indexOf(phrase.phrase); index !== -1; index = text.indexOf(phrase.phrase, index + 1)) {
      const end = index + phrase.phrase.length;
      if (!occupied.some((range) => index < range.end && end > range.start)) occurrences.push(index);
    }
    if (occurrences.length === 0) return null;

    const start = occurrences.reduce((closest, candidate) =>
      Math.abs(candidate - phrase.charStart) < Math.abs(closest - phrase.charStart) ? candidate : closest,
    );
    const end = start + phrase.phrase.length;
    occupied.push({ start, end });
    repaired.push({ ...phrase, charStart: start, charEnd: end });
  }

  return validateKeyPhrases(text, repaired) ? repaired : null;
}

async function runLevel(jobId: string, levelVersionId: string, lang: SupportedLang, sourceText: string, levelCode: string, options: PipelineOptions) {
  const level = levelForCode(levelCode);
  if (!level) throw new Error(`Unknown level code: ${levelCode}`);

  const scorer = scorerFor(lang);
  let feedback: string | undefined;
  let finalText = "";
  let finalScore = { metric: level.metric, score: 0 };
  let finalTitle: string | undefined;
  let inRange = false;
  const maxAttempts = maxVerifyAttempts();

  await prisma.levelVersion.update({ where: { id: levelVersionId }, data: { status: "converting" } });
  await logEvent(jobId, levelCode, "convert_start");

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const simplified = await simplifyText(lang, levelCode, sourceText, feedback);
    finalText = simplified.text;
    finalTitle = simplified.title;
    finalScore = scorer.score(finalText);
    inRange = finalScore.score >= level.targetMin && finalScore.score <= level.targetMax;

    await prisma.levelVersion.update({
      where: { id: levelVersionId },
      data: {
        status: "verifying",
        simplifiedText: finalText,
        attemptCount: attempt,
        readabilityMetric: finalScore.metric,
        readabilityScore: finalScore.score,
        targetMin: level.targetMin,
        targetMax: level.targetMax,
        inRange,
      },
    });
    await logEvent(jobId, levelCode, "verify_attempt", { attempt, score: finalScore.score, inRange });

    if (inRange) {
      await logEvent(jobId, levelCode, "verify_pass", { attempt, score: finalScore.score });
      break;
    }

    feedback = buildRevisionFeedback(finalScore, { targetMin: level.targetMin, targetMax: level.targetMax });
  }

  if (finalTitle) {
    await prisma.job.update({ where: { id: jobId }, data: { sourceTitle: finalTitle } });
  }

  await prisma.levelVersion.update({ where: { id: levelVersionId }, data: { status: "fact_checking" } });
  const factCheck = await factCheckText(sourceText, finalText);
  await prisma.verificationReport.upsert({
    where: { levelVersionId },
    create: {
      levelVersionId,
      retainedCount: factCheck.retainedCount,
      simplifiedCount: factCheck.simplifiedCount,
      lostCount: factCheck.lostCount,
      items: factCheck.items,
    },
    update: {
      retainedCount: factCheck.retainedCount,
      simplifiedCount: factCheck.simplifiedCount,
      lostCount: factCheck.lostCount,
      items: factCheck.items,
    },
  });
  await logEvent(jobId, levelCode, "fact_check_done", {
    retainedCount: factCheck.retainedCount,
    simplifiedCount: factCheck.simplifiedCount,
    lostCount: factCheck.lostCount,
  });

  let keyPhraseOutput = await extractKeyPhrases(lang, levelCode, finalText);
  for (let retry = 1; retry <= 2 && !validateKeyPhrases(finalText, keyPhraseOutput.phrases); retry += 1) {
    await logEvent(jobId, levelCode, "key_phrase_retry", { retry });
    keyPhraseOutput = await extractKeyPhrases(lang, levelCode, finalText);
  }
  if (!validateKeyPhrases(finalText, keyPhraseOutput.phrases)) {
    const repaired = repairKeyPhraseOffsets(finalText, keyPhraseOutput.phrases);
    if (repaired) {
      keyPhraseOutput = { ...keyPhraseOutput, phrases: repaired };
      await logEvent(jobId, levelCode, "key_phrase_offsets_corrected");
    }
  }
  if (!validateKeyPhrases(finalText, keyPhraseOutput.phrases)) throw new Error("Key phrase offsets did not match simplified text.");

  await prisma.keyPhrase.deleteMany({ where: { levelVersionId } });
  const keyPhrases = await Promise.all(
    keyPhraseOutput.phrases.map((phrase) =>
      prisma.keyPhrase.create({
        data: {
          levelVersionId,
          position: phrase.position,
          phrase: phrase.phrase,
          charStart: phrase.charStart,
          charEnd: phrase.charEnd,
          gloss: phrase.gloss,
        },
      }),
    ),
  );
  await logEvent(jobId, levelCode, "key_phrases_done");

  if (options.questionCount > 0) {
    const questionOutput = await generateQuestions(
      lang,
      levelCode,
      finalText,
      keyPhrases.map((phrase) => ({ position: phrase.position, phrase: phrase.phrase, gloss: phrase.gloss })),
      options.questionCount,
      options.questionType,
    );
    const hasLinkedQuestion = questionOutput.questions.some((question) => question.keyPhrasePosition !== null);
    if (!hasLinkedQuestion && questionOutput.questions[0] && keyPhrases[0]) {
      questionOutput.questions[0].keyPhrasePosition = keyPhrases[0].position;
    }

    await prisma.question.deleteMany({ where: { levelVersionId } });
    await Promise.all(
      questionOutput.questions.map((question) => {
        const linkedPhrase = keyPhrases.find((phrase) => phrase.position === question.keyPhrasePosition);
        return prisma.question.create({
          data: {
            levelVersionId,
            orderIndex: question.orderIndex,
            type: question.type,
            questionText: question.questionText,
            choices: question.type === "multiple_choice" ? question.choices : Prisma.JsonNull,
            answer: question.answer,
            explanation: question.explanation,
            keyPhraseId: linkedPhrase?.id,
          },
        });
      }),
    );
  }
  await logEvent(jobId, levelCode, "questions_done");

  await prisma.levelVersion.update({ where: { id: levelVersionId }, data: { status: "completed" } });
  await logEvent(jobId, levelCode, "level_completed", { inRange, score: finalScore.score });
}

export async function runPipeline(jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { levelVersions: true } });
  if (!job) throw new Error(`Job not found: ${jobId}`);

  await prisma.job.update({ where: { id: jobId }, data: { status: "processing" } });
  await logEvent(jobId, null, "job_started");

  const options = job.options as PipelineOptions;
  const results = await Promise.allSettled(
    job.levelVersions.map((levelVersion) =>
      runLevel(job.id, levelVersion.id, job.lang as SupportedLang, job.sourceText, levelVersion.levelCode, options).catch(async (error) => {
        await prisma.levelVersion.update({ where: { id: levelVersion.id }, data: { status: "failed" } });
        await logEvent(job.id, levelVersion.levelCode, "level_failed", { message: error instanceof Error ? error.message : "Unknown error" });
        throw error;
      }),
    ),
  );

  const failed = results.filter((result) => result.status === "rejected").length;
  const status = failed === 0 ? "completed" : failed === results.length ? "failed" : "partially_failed";
  await prisma.job.update({ where: { id: jobId }, data: { status, completedAt: new Date() } });
  await logEvent(jobId, null, "job_finished", { status, failed });
}
