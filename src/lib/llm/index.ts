import type { SupportedLang } from "@/lib/levels";
import { structuredOutput } from "./client";
import { buildFactCheckPrompt, buildKeyPhrasePrompt, buildQuestionsPrompt, buildSimplifyPrompt } from "./prompts";
import { factCheckSchema, keyPhraseSchema, questionsSchema, simplifySchema } from "./schemas";
import type { FactCheckOutput, KeyPhraseOutput, QuestionsOutput, SimplifyOutput } from "./types";

export async function simplifyText(lang: SupportedLang, levelCode: string, sourceText: string, feedback?: string) {
  return structuredOutput<SimplifyOutput>("simplified_material", simplifySchema, buildSimplifyPrompt(lang, levelCode, sourceText, feedback));
}

export async function factCheckText(sourceText: string, simplifiedText: string) {
  return structuredOutput<FactCheckOutput>("fact_check_report", factCheckSchema, buildFactCheckPrompt(sourceText, simplifiedText));
}

export async function extractKeyPhrases(lang: SupportedLang, levelCode: string, simplifiedText: string) {
  return structuredOutput<KeyPhraseOutput>("key_phrases", keyPhraseSchema, buildKeyPhrasePrompt(lang, levelCode, simplifiedText));
}

export async function generateQuestions(
  lang: SupportedLang,
  levelCode: string,
  simplifiedText: string,
  keyPhrases: Array<{ position: number; phrase: string; gloss: string }>,
  questionCount: number,
  questionType: "multiple_choice" | "open_ended",
) {
  return structuredOutput<QuestionsOutput>(
    "comprehension_questions",
    questionsSchema,
    buildQuestionsPrompt(lang, levelCode, simplifiedText, keyPhrases, questionCount, questionType),
  );
}

export { buildRevisionFeedback } from "./prompts";
export { LlmError } from "./client";
export type { FactCheckOutput, KeyPhraseOutput, QuestionsOutput, SimplifyOutput } from "./types";
