import { franc } from "franc";
import { NextResponse } from "next/server";
import { addOwnerCookie, ownerSessionForRequest } from "@/lib/api/ownership";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { apiError, unexpectedApiError } from "@/lib/api/errors";

function mapFranc(code: string) {
  if (code === "eng") return "en";
  if (code === "spa") return "es";
  if (code === "jpn") return "ja";
  return null;
}

export async function POST(request: Request) {
  const ownerSession = ownerSessionForRequest(request);
  try {
    const rateLimit = await enforceRateLimit(request, ownerSession.tokenHash, "detect");
    if (!rateLimit.allowed) {
      const response = apiError("RATE_LIMITED", "Language detection limit reached. Please try again later.");
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return addOwnerCookie(response, ownerSession);
    }
    const body: unknown = await request.json().catch(() => null);
    const sample = typeof body === "object" && body !== null && "text" in body && typeof body.text === "string" ? body.text.slice(0, 500) : "";
    if (!sample.trim()) return addOwnerCookie(NextResponse.json({ lang: "en", confidence: 0 }), ownerSession);

    if (/[\u3040-\u30ff\u3400-\u9fff]/.test(sample)) {
      return addOwnerCookie(NextResponse.json({ lang: "ja", confidence: 0.98 }), ownerSession);
    }

    const detected = franc(sample, { only: ["eng", "spa", "jpn"] });
    const lang = mapFranc(detected) || "en";
    const confidence = detected === "und" ? 0.4 : 0.9;
    return addOwnerCookie(NextResponse.json({ lang, confidence }), ownerSession);
  } catch (error) {
    return addOwnerCookie(unexpectedApiError(error), ownerSession);
  }
}
