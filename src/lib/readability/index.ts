import type { SupportedLang } from "@/lib/levels";
import { EnglishScorer } from "./en";
import { SpanishScorer } from "./es";
import { JapaneseScorer } from "./ja";
import type { Scorer } from "./types";

export function scorerFor(lang: SupportedLang): Scorer {
  switch (lang) {
    case "en":
      return new EnglishScorer();
    case "es":
      return new SpanishScorer();
    case "ja":
      return new JapaneseScorer();
  }
}

export type { Scorer, ScoreResult } from "./types";
export { NotImplementedError } from "./types";
