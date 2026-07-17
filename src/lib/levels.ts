export type SupportedLang = "en" | "ja" | "es";

export type ReadabilityMetric = "fkgl" | "fernandez_huerta" | "ja_composite";

export type LevelSpec = {
  code: string;
  lang: SupportedLang;
  label: string;
  metric: ReadabilityMetric;
  targetMin: number;
  targetMax: number;
  style: {
    sentenceLength: string;
    vocabulary: string;
    avoid: string[];
    structures: string;
  };
};

export const LEVELS = [
  {
    code: "en_g2-3",
    lang: "en",
    label: "Grade 2-3",
    metric: "fkgl",
    targetMin: 2.0,
    targetMax: 3.5,
    style: {
      sentenceLength: "Use short sentences, usually 8-10 words.",
      vocabulary: "Use common everyday words and explain any necessary academic word.",
      avoid: ["passive voice", "idioms", "long clauses"],
      structures: "Prefer subject-verb-object sentences and concrete examples.",
    },
  },
  {
    code: "en_g4-5",
    lang: "en",
    label: "Grade 4-5",
    metric: "fkgl",
    targetMin: 4.0,
    targetMax: 5.5,
    style: {
      sentenceLength: "Use mostly 10-14 word sentences.",
      vocabulary: "Use grade-school academic words with brief context clues.",
      avoid: ["dense noun phrases", "unexplained technical terms"],
      structures: "Use simple compound sentences sparingly.",
    },
  },
  {
    code: "en_g6-8",
    lang: "en",
    label: "Grade 6-8",
    metric: "fkgl",
    targetMin: 6.0,
    targetMax: 8.5,
    style: {
      sentenceLength: "Use varied sentences, usually under 20 words.",
      vocabulary: "Keep key academic terms when they are central and define them in context.",
      avoid: ["college-level syntax", "unnecessary jargon"],
      structures: "Use clear transitions and occasional dependent clauses.",
    },
  },
  {
    code: "en_ell_a2b1",
    lang: "en",
    label: "ELL A2-B1",
    metric: "fkgl",
    targetMin: 3.0,
    targetMax: 5.0,
    style: {
      sentenceLength: "Use direct sentences, usually 8-14 words.",
      vocabulary: "Use high-frequency words and repeat important terms consistently.",
      avoid: ["idioms", "phrasal verbs when avoidable", "cultural references without context"],
      structures: "Use present and past tense forms clearly; avoid stacked clauses.",
    },
  },
  {
    code: "ja_sho1-2",
    lang: "ja",
    label: "小1-2",
    metric: "ja_composite",
    targetMin: 1,
    targetMax: 2,
    style: {
      sentenceLength: "Use very short Japanese sentences.",
      vocabulary: "Use early elementary vocabulary and kana support where helpful.",
      avoid: ["difficult kanji", "abstract nominalizations"],
      structures: "Prefer simple declarative sentences.",
    },
  },
  {
    code: "ja_sho3-4",
    lang: "ja",
    label: "小3-4",
    metric: "ja_composite",
    targetMin: 3,
    targetMax: 4,
    style: {
      sentenceLength: "Use short Japanese sentences.",
      vocabulary: "Use middle elementary vocabulary.",
      avoid: ["specialized terms without explanation"],
      structures: "Use simple cause-and-effect expressions.",
    },
  },
  {
    code: "ja_sho5-6",
    lang: "ja",
    label: "小5-6",
    metric: "ja_composite",
    targetMin: 5,
    targetMax: 6,
    style: {
      sentenceLength: "Use clear upper-elementary Japanese sentences.",
      vocabulary: "Use common academic words with short explanations.",
      avoid: ["adult newspaper style", "long nested modifiers"],
      structures: "Use explanatory paragraphs with clear connectors.",
    },
  },
  {
    code: "ja_jlpt_n4n3",
    lang: "ja",
    label: "JLPT N4-N3",
    metric: "ja_composite",
    targetMin: 3,
    targetMax: 4,
    style: {
      sentenceLength: "Use short learner-friendly Japanese sentences.",
      vocabulary: "Favor JLPT N4-N3 vocabulary and explain unavoidable terms.",
      avoid: ["rare kanji", "contracted expressions"],
      structures: "Use standard polite or plain forms consistently.",
    },
  },
  // TODO: calibrate ES ranges with representative classroom samples.
  {
    code: "es_g2-3",
    lang: "es",
    label: "Grado 2-3",
    metric: "fernandez_huerta",
    targetMin: 91,
    targetMax: 100,
    style: {
      sentenceLength: "Use very short Spanish sentences, usually 8-10 words.",
      vocabulary: "Use common concrete words and explain academic terms.",
      avoid: ["subjunctive", "long subordinate clauses"],
      structures: "Prefer present tense and direct sentence order.",
    },
  },
  {
    code: "es_g4-5",
    lang: "es",
    label: "Grado 4-5",
    metric: "fernandez_huerta",
    targetMin: 81,
    targetMax: 90,
    style: {
      sentenceLength: "Use short Spanish sentences, usually 10-14 words.",
      vocabulary: "Use familiar school vocabulary with context clues.",
      avoid: ["dense technical vocabulary", "multiple clauses in one sentence"],
      structures: "Use simple connectors such as porque, entonces, and despues.",
    },
  },
  {
    code: "es_g6-8",
    lang: "es",
    label: "Grado 6-8",
    metric: "fernandez_huerta",
    targetMin: 66,
    targetMax: 80,
    style: {
      sentenceLength: "Use varied Spanish sentences, usually under 20 words.",
      vocabulary: "Keep important academic terms and define them naturally.",
      avoid: ["unnecessary jargon"],
      structures: "Use clear explanatory paragraphs with transitions.",
    },
  },
  {
    code: "es_cefr_a2b1",
    lang: "es",
    label: "CEFR A2-B1",
    metric: "fernandez_huerta",
    targetMin: 76,
    targetMax: 90,
    style: {
      sentenceLength: "Use direct Spanish sentences, usually 8-14 words.",
      vocabulary: "Use high-frequency words and repeat key terms.",
      avoid: ["idioms", "regional slang", "complex subjunctive uses"],
      structures: "Prefer present, preterite, and clear connectors.",
    },
  },
] as const satisfies readonly LevelSpec[];

export type LevelCode = (typeof LEVELS)[number]["code"];

export const LEVEL_BY_CODE = Object.fromEntries(LEVELS.map((level) => [level.code, level])) as Record<LevelCode, LevelSpec>;

export function levelsForLang(lang: SupportedLang) {
  return LEVELS.filter((level) => level.lang === lang);
}

export function levelForCode(code: string): LevelSpec | undefined {
  return LEVELS.find((level) => level.code === code);
}
