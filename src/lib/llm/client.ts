import "server-only";
import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-5.6";
const DEFAULT_TIMEOUT_MS = 45_000;

let client: OpenAI | null = null;

function getClient() {
  const configuredTimeout = Number(process.env.OPENAI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const timeout = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : DEFAULT_TIMEOUT_MS;
  // Retries are owned by structuredOutput so every retry is logged and bounded.
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0, timeout });
  return client;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class LlmError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "LlmError";
  }
}

export async function structuredOutput<T>(name: string, schema: Record<string, unknown>, prompt: string): Promise<T> {
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await getClient().responses.create({
        model,
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name,
            strict: true,
            schema,
          },
        },
      });

      const text = response.output_text;
      if (!text) throw new Error("OpenAI response did not include output_text.");
      return JSON.parse(text) as T;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await sleep(500 * 2 ** attempt);
    }
  }

  throw new LlmError("OpenAI structured output failed after retries.", { cause: lastError });
}
