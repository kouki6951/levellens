import { describe, expect, it } from "vitest";
import { repairKeyPhraseOffsets } from "./pipeline";

describe("repairKeyPhraseOffsets", () => {
  it("repairs one-based LLM offsets for Spanish text with accented characters", () => {
    const text = "La pensión incluye un pago llamado shibō ichijikin para la familia.";
    const phrases = [
      { phrase: "pensión", charStart: 4, charEnd: 11 },
      { phrase: "shibō ichijikin", charStart: 34, charEnd: 49 },
      { phrase: "la familia", charStart: 56, charEnd: 66 },
    ];

    const repaired = repairKeyPhraseOffsets(text, phrases);

    expect(repaired).not.toBeNull();
    for (const phrase of repaired ?? []) {
      expect(text.slice(phrase.charStart, phrase.charEnd)).toBe(phrase.phrase);
    }
  });

  it("rejects phrases that are not copied from the simplified text", () => {
    const text = "La pensión incluye un pago único para la familia.";
    const phrases = [
      { phrase: "pensión", charStart: 0, charEnd: 0 },
      { phrase: "pago único", charStart: 0, charEnd: 0 },
      { phrase: "beneficio perdido", charStart: 0, charEnd: 0 },
    ];

    expect(repairKeyPhraseOffsets(text, phrases)).toBeNull();
  });
});
