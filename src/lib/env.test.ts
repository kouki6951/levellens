import { describe, expect, it } from "vitest";
import { validateServerEnvironment } from "./env";

describe("validateServerEnvironment", () => {
  const validEnvironment = {
    DATABASE_URL: "postgresql://user:password@host.example/database?sslmode=require",
    OPENAI_API_KEY: "sk-test",
    OPENAI_MODEL: "gpt-5.6",
    VERCEL_ENV: "production",
    CRON_SECRET: "long-random-secret",
  };

  it("accepts complete server configuration", () => {
    expect(() => validateServerEnvironment(validEnvironment)).not.toThrow();
  });

  it("rejects missing production secrets without exposing their values", () => {
    expect(() => validateServerEnvironment({ ...validEnvironment, CRON_SECRET: "" })).toThrow("CRON_SECRET is required");
  });
});
