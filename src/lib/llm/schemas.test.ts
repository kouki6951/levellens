import { describe, expect, it } from "vitest";
import { questionsSchemaFor } from "./schemas";

describe("questionsSchemaFor", () => {
  it("requires the requested number of four-choice questions", () => {
    const schema = questionsSchemaFor("multiple_choice", 3);
    const questions = schema.properties.questions;
    const choices = questions.items.properties.choices;

    expect(questions.minItems).toBe(3);
    expect(questions.maxItems).toBe(3);
    expect(questions.items.properties.type.enum).toEqual(["multiple_choice"]);
    expect(choices).toMatchObject({ minItems: 4, maxItems: 4 });
  });

  it("keeps open-ended questions free of multiple-choice options", () => {
    const schema = questionsSchemaFor("open_ended", 1);
    const choices = schema.properties.questions.items.properties.choices;

    expect(schema.properties.questions.items.properties.type.enum).toEqual(["open_ended"]);
    expect(choices).toMatchObject({ minItems: 0, maxItems: 0 });
  });
});
