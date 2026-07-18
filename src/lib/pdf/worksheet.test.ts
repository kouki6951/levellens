import { describe, expect, it } from "vitest";
import { answerFor, type WorksheetQuestion } from "./worksheet";

describe("answerFor", () => {
  it("renders a stored choice index as a letter and the full correct choice", () => {
    const question: WorksheetQuestion = { id: "q1", orderIndex: 1, questionText: "What helps plants grow?", choices: ["Wind", "Water", "Sand", "Glass"], answer: "1", explanation: null };
    expect(answerFor(question)).toBe("B. Water");
  });

  it("preserves a non-index answer", () => {
    const question: WorksheetQuestion = { id: "q1", orderIndex: 1, questionText: "Why?", choices: null, answer: "Because it provides shade.", explanation: null };
    expect(answerFor(question)).toBe("Because it provides shade.");
  });
});
