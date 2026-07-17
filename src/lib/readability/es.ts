import type { Scorer, ScoreResult } from "./types";

const VOWELS = "aeiouáéíóúü";
const STRONG_VOWELS = "aáeéoó";
const WEAK_VOWELS = "iíuúü";

function normalizeWord(word: string) {
  return word.toLowerCase().replace(/^[^a-záéíóúüñ]+|[^a-záéíóúüñ]+$/gi, "");
}

function hasAccent(char: string) {
  return "áéíóú".includes(char);
}

function isVowel(char: string) {
  return VOWELS.includes(char);
}

function startsVowelGroup(word: string, index: number) {
  return isVowel(word[index] ?? "");
}

function vowelGroupSyllables(group: string) {
  if (group.length <= 1) return group.length;
  const vowels = [...group];
  let syllables = 1;

  for (let index = 1; index < vowels.length; index += 1) {
    const previous = vowels[index - 1];
    const current = vowels[index];
    const bothStrong = STRONG_VOWELS.includes(previous) && STRONG_VOWELS.includes(current);
    const accentedWeakBreak =
      (WEAK_VOWELS.includes(previous) && hasAccent(previous)) || (WEAK_VOWELS.includes(current) && hasAccent(current));

    if (bothStrong || accentedWeakBreak) syllables += 1;
  }

  return syllables;
}

export function countSpanishSyllables(word: string) {
  const normalized = normalizeWord(word);
  if (!normalized) return 0;

  let syllables = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    if (!startsVowelGroup(normalized, index)) continue;

    let group = "";
    while (index < normalized.length && isVowel(normalized[index])) {
      group += normalized[index];
      index += 1;
    }
    index -= 1;
    syllables += vowelGroupSyllables(group);
  }

  return Math.max(1, syllables);
}

function words(text: string) {
  return Array.from(text.matchAll(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g)).map((match) => match[0]);
}

function sentenceCount(text: string) {
  const count = text.split(/[.!?¡¿]+/).filter((part) => part.trim().length > 0).length;
  return Math.max(1, count);
}

export function fernandezHuerta(text: string) {
  const wordList = words(text);
  if (wordList.length === 0) return 0;

  const syllables = wordList.reduce((total, word) => total + countSpanishSyllables(word), 0);
  const p = (syllables / wordList.length) * 100;
  const f = sentenceCount(text) === 0 ? wordList.length : wordList.length / sentenceCount(text);
  const score = 206.84 - 0.6 * p - 1.02 * f;

  return Number(score.toFixed(2));
}

export class SpanishScorer implements Scorer {
  lang = "es" as const;

  score(text: string): ScoreResult {
    return {
      metric: "fernandez_huerta",
      score: fernandezHuerta(text),
    };
  }
}
