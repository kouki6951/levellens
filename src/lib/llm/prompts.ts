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
    lang === "ja" ? "Write plain Japanese without furigana. Do not add ruby annotations or parenthetical readings." : "",
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

  const languageGuidance = lang === "ja"
    ? "Prioritize particles, verb forms, connective expressions, polite/plain forms, and common sentence patterns."
    : lang === "es"
      ? "Prioritize verb forms, connectors, prepositions, pronoun patterns, and common clause structures."
      : "Prioritize verb forms, modals, connectors, prepositions, articles, and common clause structures.";

  return [
    "Extract exactly 3 language-focus snippets from the simplified text for reading and grammar instruction.",
    `Language: ${lang}. Reading level: ${level.label}.`,
    languageGuidance,
    "Choose teachable grammar or sentence-pattern examples before content vocabulary.",
    "Do not choose a named entity or isolated topic word unless it is part of a teachable language pattern.",
    "Each phrase must be copied exactly from the simplified text.",
    "Each phrase must be one contiguous excerpt. Select three distinct patterns when possible.",
    "Write each gloss at the same reading level as the simplified text. Explain how the expression works in the sentence, not only what the words mean.",
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
    "At least one question must link to a language-focus snippet by keyPhrasePosition and ask how that expression works in the passage.",
    "Use null for keyPhrasePosition only when the question is not based on a language-focus snippet.",
    `Language focus snippets:\n${JSON.stringify(keyPhrases)}`,
    `Simplified text:\n${simplifiedText}`,
  ].join("\n\n");
}

export function buildRevisionFeedback(scoreResult: ScoreResult, target: { targetMin: number; targetMax: number }) {
  if (scoreResult.metric === "ja_composite") {
    const maximumGrade = Math.floor(target.targetMax);
    if (scoreResult.score < target.targetMin) {
      return `現在の推定学年は ${scoreResult.score.toFixed(2)}、目標は ${target.targetMin.toFixed(1)}-${target.targetMax.toFixed(1)}です。内容を幼くしすぎず、対象学年で学ぶ漢字と説明語を無理のない範囲で保ってください。文の平均長は25字程度までにしてください。`;
    }
    const offending = Object.entries(scoreResult.details?.kanjiGrades ?? {})
      .filter(([, grade]) => grade > maximumGrade)
      .map(([character]) => character)
      .slice(0, 8);
    const kanjiFeedback = offending.length > 0
      ? `「${offending.join("」「")}」は対象学年を超えています。ひらがなに開くか、やさしい言葉に置き換えてください。`
      : "対象学年より難しい漢字を減らしてください。";
    const sentenceFeedback = scoreResult.details?.averageSentenceLength && scoreResult.details.averageSentenceLength > 25
      ? `文の平均長を25字以下にしてください（現在 ${scoreResult.details.averageSentenceLength}字）。`
      : "短く直接的な文にしてください。";
    return `現在の推定学年は ${scoreResult.score.toFixed(2)}、目標は ${target.targetMin.toFixed(1)}-${target.targetMax.toFixed(1)}です。${kanjiFeedback}${sentenceFeedback}`;
  }

  const direction =
    scoreResult.score < target.targetMin
      ? "The text is too easy. Add modest sentence variety and keep necessary academic terms."
      : "The text is too hard. Shorten sentences, replace multi-syllable words, and simplify clauses.";

  return `Current ${scoreResult.metric} is ${scoreResult.score.toFixed(2)}, target ${target.targetMin.toFixed(2)}-${target.targetMax.toFixed(2)}. ${direction}`;
}
