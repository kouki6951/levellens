import { describe, expect, it } from "vitest";
import { EnglishScorer } from "./en";
import { countSpanishSyllables, SpanishScorer } from "./es";
import { JapaneseScorer } from "./ja";
import { JAPANESE_FIXTURES, SPANISH_FIXTURES } from "./fixtures";

describe("EnglishScorer", () => {
  const scorer = new EnglishScorer();

  it("computes FKGL bands for fixture texts", () => {
    const easy = scorer.score("A plant needs sun. It needs water. It grows in soil.").score;
    const middle = scorer.score(
      "Water evaporates when heat from the sun changes liquid water into vapor. Later, the vapor cools and forms clouds.",
    ).score;
    const hard = scorer.score(
      "Photosynthesis is a biochemical process in which chlorophyll captures electromagnetic energy and converts carbon dioxide and water into glucose and oxygen.",
    ).score;

    expect(easy).toBeGreaterThanOrEqual(-3);
    expect(easy).toBeLessThanOrEqual(3.5);
    expect(middle).toBeGreaterThan(3.5);
    expect(middle).toBeLessThanOrEqual(8.5);
    expect(hard).toBeGreaterThan(10);
  });
});

describe("SpanishScorer", () => {
  const scorer = new SpanishScorer();

  it("counts common Spanish syllable patterns", () => {
    expect(countSpanishSyllables("agua")).toBe(2);
    expect(countSpanishSyllables("energía")).toBe(4);
    expect(countSpanishSyllables("ciencia")).toBe(2);
  });

  it("computes Fernandez-Huerta bands for fixture texts", () => {
    const easy = scorer.score(SPANISH_FIXTURES.easy).score;
    const middle = scorer.score(SPANISH_FIXTURES.middle).score;
    const hard = scorer.score(SPANISH_FIXTURES.hard).score;

    expect(easy).toBeGreaterThanOrEqual(91);
    expect(middle).toBeGreaterThanOrEqual(70);
    expect(middle).toBeLessThanOrEqual(90);
    expect(hard).toBeLessThan(middle);
  });
});

describe("JapaneseScorer", () => {
  const scorer = new JapaneseScorer();

  it("estimates elementary grade bands from kanji difficulty and sentence length", () => {
    const easy = scorer.score(JAPANESE_FIXTURES.easy);
    const middle = scorer.score(JAPANESE_FIXTURES.middle);
    const hard = scorer.score(JAPANESE_FIXTURES.hard);

    expect(easy.score).toBeGreaterThanOrEqual(1.0);
    expect(easy.score).toBeLessThanOrEqual(2.5);
    expect(middle.score).toBeGreaterThanOrEqual(2.6);
    expect(middle.score).toBeLessThanOrEqual(4.5);
    expect(hard.score).toBeGreaterThanOrEqual(4.6);
    expect(hard.details?.kanjiGrades?.環).toBe(7);
    expect(hard.details?.averageSentenceLength).toBeGreaterThan(25);
  });
});
