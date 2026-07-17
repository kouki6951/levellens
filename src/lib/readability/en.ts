import readability from "text-readability";
import type { Scorer, ScoreResult } from "./types";

export class EnglishScorer implements Scorer {
  lang = "en" as const;

  score(text: string): ScoreResult {
    return {
      metric: "fkgl",
      score: readability.fleschKincaidGrade(text),
    };
  }
}
