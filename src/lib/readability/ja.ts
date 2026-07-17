import type { Scorer, ScoreResult } from "./types";
import { NotImplementedError } from "./types";

export class JapaneseScorer implements Scorer {
  lang = "ja" as const;

  score(text: string): ScoreResult {
    void text;
    throw new NotImplementedError("Japanese readability scoring is not implemented yet.");
  }
}
