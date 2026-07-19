import "server-only";

type Environment = Record<string, string | undefined>;

function isPostgresUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "postgresql:" || url.protocol === "postgres:";
  } catch {
    return false;
  }
}

/** Validates only server configuration; no secret values are logged or returned. */
export function validateServerEnvironment(environment: Environment = process.env) {
  const issues: string[] = [];
  if (!environment.DATABASE_URL || !isPostgresUrl(environment.DATABASE_URL)) issues.push("DATABASE_URL must be a PostgreSQL URL");
  if (!environment.OPENAI_API_KEY?.trim()) issues.push("OPENAI_API_KEY is required");
  if (environment.OPENAI_MODEL !== undefined && !environment.OPENAI_MODEL.trim()) issues.push("OPENAI_MODEL cannot be empty");
  if (environment.VERCEL_ENV === "production" && !environment.CRON_SECRET?.trim()) issues.push("CRON_SECRET is required in Vercel production");
  if (issues.length > 0) throw new Error(`Invalid server environment: ${issues.join("; ")}`);
}
