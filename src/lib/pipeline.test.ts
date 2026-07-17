import { describe, expect, it } from "vitest";
import { locateKeyPhrases } from "./pipeline";

describe("locateKeyPhrases", () => {
  it("calculates offsets for Spanish text with accented characters", () => {
    const text = "La pensión incluye un pago llamado shibō ichijikin para la familia.";
    const phrases = [
      { phrase: "pensión" },
      { phrase: "shibō ichijikin" },
      { phrase: "la familia" },
    ];

    const located = locateKeyPhrases(text, phrases);

    expect(located).not.toBeNull();
    for (const phrase of located ?? []) {
      expect(text.slice(phrase.charStart, phrase.charEnd)).toBe(phrase.phrase);
    }
  });

  it("rejects phrases that are not copied from the simplified text", () => {
    const text = "La pensión incluye un pago único para la familia.";
    const phrases = [
      { phrase: "pensión" },
      { phrase: "pago único" },
      { phrase: "beneficio perdido" },
    ];

    expect(locateKeyPhrases(text, phrases)).toBeNull();
  });
});
