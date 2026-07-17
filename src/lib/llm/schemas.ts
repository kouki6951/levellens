export const simplifySchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "text"],
  properties: {
    title: { type: "string" },
    text: { type: "string" },
  },
} as const;

export const factCheckSchema = {
  type: "object",
  additionalProperties: false,
  required: ["retainedCount", "simplifiedCount", "lostCount", "items"],
  properties: {
    retainedCount: { type: "integer", minimum: 0 },
    simplifiedCount: { type: "integer", minimum: 0 },
    lostCount: { type: "integer", minimum: 0 },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["fact", "status", "sourceSpan", "note"],
        properties: {
          fact: { type: "string" },
          status: { type: "string", enum: ["retained", "simplified", "lost"] },
          sourceSpan: { type: "string" },
          note: { type: "string" },
        },
      },
    },
  },
} as const;

export const keyPhraseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["phrases"],
  properties: {
    phrases: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["position", "phrase", "gloss"],
        properties: {
          position: { type: "integer", minimum: 1, maximum: 3 },
          phrase: { type: "string" },
          gloss: { type: "string" },
        },
      },
    },
  },
} as const;

export const questionsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["orderIndex", "type", "questionText", "choices", "answer", "explanation", "keyPhrasePosition"],
        properties: {
          orderIndex: { type: "integer", minimum: 1 },
          type: { type: "string", enum: ["multiple_choice", "open_ended"] },
          questionText: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          answer: { type: "string" },
          explanation: { type: "string" },
          keyPhrasePosition: { anyOf: [{ type: "integer", minimum: 1, maximum: 3 }, { type: "null" }] },
        },
      },
    },
  },
} as const;
