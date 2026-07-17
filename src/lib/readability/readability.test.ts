import { describe, expect, it } from "vitest";
import { EnglishScorer } from "./en";
import { countSpanishSyllables, SpanishScorer } from "./es";
import { JapaneseScorer } from "./ja";
import { NotImplementedError } from "./types";

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
    const easy = scorer.score("El sol calienta el agua. El agua sube al aire. Luego cae como lluvia.").score;
    const middle = scorer.score("La evaporacion ocurre cuando el calor cambia el agua liquida en vapor que sube a la atmosfera.").score;
    const hard = scorer.score(
      "La fotosintesis transforma moleculas inorganicas mediante reacciones bioquimicas complejas que dependen de pigmentos especializados y energia solar.",
    ).score;

    expect(easy).toBeGreaterThanOrEqual(91);
    expect(middle).toBeGreaterThanOrEqual(66);
    expect(middle).toBeLessThan(91);
    expect(hard).toBeLessThan(middle);
  });
});

describe("JapaneseScorer", () => {
  it("is a deliberate stub for day one", () => {
    expect(() => new JapaneseScorer().score("これはテストです。")).toThrow(NotImplementedError);
  });
});
