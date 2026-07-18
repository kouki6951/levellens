import { describe, expect, it } from "vitest";
import { buildKeyPhrasePrompt, buildRevisionFeedback } from "./prompts";

describe("buildRevisionFeedback", () => {
  it("lists Japanese kanji that exceed the target grade", () => {
    const feedback = buildRevisionFeedback(
      {
        metric: "ja_composite",
        score: 5.2,
        details: {
          averageSentenceLength: 31,
          kanjiGrades: { 環: 7, 境: 7, 循: 7, 水: 1 },
        },
      },
      { targetMin: 1, targetMax: 2.5 },
    );

    expect(feedback).toContain("環");
    expect(feedback).toContain("境");
    expect(feedback).toContain("25字以下");
  });

  it("does not ask for further simplification when Japanese text is below its target", () => {
    const feedback = buildRevisionFeedback(
      { metric: "ja_composite", score: 1.4, details: { averageSentenceLength: 10, kanjiGrades: {} } },
      { targetMin: 4.6, targetMax: 6.5 },
    );

    expect(feedback).toContain("幼くしすぎず");
    expect(feedback).not.toContain("ひらがなに開く");
  });
});

describe("buildKeyPhrasePrompt", () => {
  it("prioritizes grammar and sentence patterns over topic vocabulary", () => {
    const prompt = buildKeyPhrasePrompt("en", "en_g2-3", "Plants can help a city because they give shade.");

    expect(prompt).toContain("grammar or sentence-pattern examples");
    expect(prompt).toContain("not only what the words mean");
    expect(prompt).toContain("modals, connectors, prepositions");
  });
});
