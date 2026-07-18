import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/errors";
import { ArticleImportError, importArticle } from "@/lib/article-import";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as { url?: unknown } | null;
  try {
    const article = await importArticle(payload?.url);
    return NextResponse.json(article);
  } catch (error) {
    if (error instanceof ArticleImportError) return apiError(error.code);
    return apiError("INTERNAL_ERROR");
  }
}
