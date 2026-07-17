import type { Scorer, ScoreResult } from "./types";
import { NotImplementedError } from "./types";

export class JapaneseScorer implements Scorer {
  lang = "ja" as const;

  score(_text: string): ScoreResult {
    throw new NotImplementedError("Japanese readability scoring is not implemented yet.");
  }
}
