import { levelForCode, type SupportedLang } from "@/lib/levels";
import type { ScoreResult } from "@/lib/readability";

export function buildSimplifyPrompt(lang: SupportedLang, levelCode: string, sourceText: string, feedback?: string) {
  const level = levelForCode(levelCode);
  if (!level) throw new Error(`Unknown level code: ${levelCode}`);

  return [
    "Rewrite the source teaching material for the requested reading level.",
    `Language: ${lang}. Target level: ${level.label} (${level.code}).`,
    `Sentence guidance: ${level.style.sentenceLength}`,
    `Vocabulary guidance: ${level.style.vocabulary}`,
    `Structures: ${level.style.structures}`,
    `Avoid: ${level.style.avoid.join(", ")}.`,
    "Preserve all important facts. Do not add new facts.",
    "Return a concise source title and the rewritten text only.",
    feedback ? `Machine verification feedback to fix: ${feedback}` : "",
    `Source:\n${sourceText}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildFactCheckPrompt(sourceText: string, simplifiedText: string) {
  return [
    "Compare the simplified text against the source teaching material.",
    "List key factual claims and classify each as retained, simplified, or lost.",
    "Use lost only when the simplified text omits or distorts a materially important fact.",
    `Source:\n${sourceText}`,
    `Simplified text:\n${simplifiedText}`,
  ].join("\n\n");
}

export function buildKeyPhrasePrompt(lang: SupportedLang, levelCode: string, simplifiedText: string) {
  const level = levelForCode(levelCode);
  if (!level) throw new Error(`Unknown level code: ${levelCode}`);

  return [
    "Extract exactly 3 important phrases from the simplified text.",
    `Language: ${lang}. Reading level: ${level.label}.`,
    "Each phrase must be copied exactly from the simplified text.",
    "charStart is the zero-based character offset where the exact phrase starts; charEnd is the exclusive end offset.",
    "Write each gloss at the same reading level as the simplified text.",
    `Simplified text:\n${simplifiedText}`,
  ].join("\n\n");
}

export function buildQuestionsPrompt(
  lang: SupportedLang,
  levelCode: string,
  simplifiedText: string,
  keyPhrases: Array<{ position: number; phrase: string; gloss: string }>,
  questionCount: number,
  questionType: "multiple_choice" | "open_ended",
) {
  const level = levelForCode(levelCode);
  if (!level) throw new Error(`Unknown level code: ${levelCode}`);

  return [
    `Create ${questionCount} comprehension questions in ${lang} for ${level.label}.`,
    `Question type: ${questionType}. If multiple_choice, provide exactly 4 choices and answer as the zero-based choice index string.`,
    "At least one question must link to a key phrase by keyPhrasePosition.",
    "Use null for keyPhrasePosition only when the question is not based on a key phrase.",
    `Key phrases:\n${JSON.stringify(keyPhrases)}`,
    `Simplified text:\n${simplifiedText}`,
  ].join("\n\n");
}

export function buildRevisionFeedback(scoreResult: ScoreResult, target: { targetMin: number; targetMax: number }) {
  const direction =
    scoreResult.score < target.targetMin
      ? "The text is too easy. Add modest sentence variety and keep necessary academic terms."
      : "The text is too hard. Shorten sentences, replace multi-syllable words, and simplify clauses.";

  return `Current ${scoreResult.metric} is ${scoreResult.score.toFixed(2)}, target ${target.targetMin.toFixed(2)}-${target.targetMax.toFixed(2)}. ${direction}`;
}
