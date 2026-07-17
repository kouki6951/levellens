import type { ReadabilityMetric, SupportedLang } from "@/lib/levels";

export type ScoreResult = {
  metric: ReadabilityMetric;
  score: number;
  details?: {
    averageSentenceLength?: number;
    kanjiGrades?: Record<string, number>;
  };
};

export interface Scorer {
  lang: SupportedLang;
  score(text: string): ScoreResult;
}

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}
