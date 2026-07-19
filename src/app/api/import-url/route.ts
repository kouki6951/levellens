import { NextResponse } from "next/server";
import { apiError, unexpectedApiError } from "@/lib/api/errors";
import { ArticleImportError, importArticle } from "@/lib/article-import";
import { addOwnerCookie, ownerSessionForRequest } from "@/lib/api/ownership";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(request: Request) {
  const ownerSession = ownerSessionForRequest(request);
  try {
    const payload = await request.json().catch(() => null) as { url?: unknown } | null;
    const rateLimit = await enforceRateLimit(request, ownerSession.tokenHash, "import");
    if (!rateLimit.allowed) {
      const response = apiError("RATE_LIMITED", "Import limit reached. Please try again later.");
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return addOwnerCookie(response, ownerSession);
    }
    const article = await importArticle(payload?.url);
    return addOwnerCookie(NextResponse.json(article), ownerSession);
  } catch (error) {
    if (error instanceof ArticleImportError) return addOwnerCookie(apiError(error.code), ownerSession);
    return addOwnerCookie(unexpectedApiError(error), ownerSession);
  }
}
