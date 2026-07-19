export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateServerEnvironment } = await import("@/lib/env");
  validateServerEnvironment();
}
