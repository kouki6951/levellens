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

export function questionsSchemaFor(questionType: "multiple_choice" | "open_ended", questionCount: number) {
  const isMultipleChoice = questionType === "multiple_choice";
  return {
    type: "object",
    additionalProperties: false,
    required: ["questions"],
    properties: {
      questions: {
        type: "array",
        minItems: questionCount,
        maxItems: questionCount,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["orderIndex", "type", "questionText", "choices", "answer", "explanation", "keyPhrasePosition"],
          properties: {
            orderIndex: { type: "integer", minimum: 1, maximum: questionCount },
            type: { type: "string", enum: [questionType] },
            questionText: { type: "string" },
            choices: isMultipleChoice
              ? { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } }
              : { type: "array", minItems: 0, maxItems: 0, items: { type: "string" } },
            answer: { type: "string" },
            explanation: { type: "string" },
            keyPhrasePosition: { anyOf: [{ type: "integer", minimum: 1, maximum: 3 }, { type: "null" }] },
          },
        },
      },
    },
  } as const;
}
