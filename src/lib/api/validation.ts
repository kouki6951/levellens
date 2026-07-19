import { levelForCode, levelsForLang, type SupportedLang } from "@/lib/levels";

export function isSupportedLang(value: unknown): value is SupportedLang {
  return value === "en" || value === "ja" || value === "es";
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export type SourceCitation = { url: string; title: string; domain: string; accessedAt: string };
export type ExportPayload = {
  jobId: string;
  levelCodes: string[];
  include?: { keyPhraseBox?: boolean; questions?: boolean; answerPage?: boolean; teacherSummary?: boolean };
  locale?: "en" | "es" | "ja";
};

export function validatePublicHttpUrl(value: unknown): URL | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

export function validateExportPayload(payload: unknown): ExportPayload | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  if (typeof body.jobId !== "string" || !isUuid(body.jobId)) return null;
  if (!Array.isArray(body.levelCodes) || body.levelCodes.length < 1 || body.levelCodes.length > 4) return null;
  if (!body.levelCodes.every((code) => typeof code === "string" && /^[a-z0-9_-]{1,20}$/i.test(code))) return null;
  if (new Set(body.levelCodes).size !== body.levelCodes.length) return null;

  let include: ExportPayload["include"];
  if (body.include !== undefined) {
    if (!body.include || typeof body.include !== "object") return null;
    const candidate = body.include as Record<string, unknown>;
    const allowed = ["keyPhraseBox", "questions", "answerPage", "teacherSummary"];
    if (Object.keys(candidate).some((key) => !allowed.includes(key)) || Object.values(candidate).some((value) => typeof value !== "boolean")) return null;
    include = candidate as ExportPayload["include"];
  }

  if (body.locale !== undefined && !isSupportedLang(body.locale)) return null;
  return { jobId: body.jobId, levelCodes: body.levelCodes, include, locale: body.locale };
}

export function validateSimplifyPayload(payload: unknown):
  | {
      ok: true;
      data: {
        sourceText: string;
        source?: SourceCitation;
        lang: SupportedLang;
        targetLevels: string[];
        options: { questionCount: 0 | 3 | 5; questionType: "multiple_choice" | "open_ended"; glossEnabled: boolean };
      };
    }
  | { ok: false; code: "TEXT_LENGTH_INVALID" | "LANG_INVALID" | "LEVELS_INVALID" | "OPTIONS_INVALID" | "URL_INVALID" } {
  if (!payload || typeof payload !== "object") return { ok: false, code: "TEXT_LENGTH_INVALID" };
  const body = payload as Record<string, unknown>;

  if (typeof body.sourceText !== "string" || body.sourceText.length < 200 || body.sourceText.length > 8000) {
    return { ok: false, code: "TEXT_LENGTH_INVALID" };
  }
  if (!isSupportedLang(body.lang)) return { ok: false, code: "LANG_INVALID" };
  if (!Array.isArray(body.targetLevels) || body.targetLevels.length < 1 || body.targetLevels.length > 4) {
    return { ok: false, code: "LEVELS_INVALID" };
  }
  const allowedCodes = new Set<string>(levelsForLang(body.lang).map((level) => level.code));
  if (!body.targetLevels.every((code) => typeof code === "string" && allowedCodes.has(code) && levelForCode(code))) {
    return { ok: false, code: "LEVELS_INVALID" };
  }

  const options = (body.options ?? {}) as Record<string, unknown>;
  let source: SourceCitation | undefined;
  if (body.source !== undefined && body.source !== null) {
    if (!body.source || typeof body.source !== "object") return { ok: false, code: "URL_INVALID" };
    const citation = body.source as Record<string, unknown>;
    const url = validatePublicHttpUrl(citation.url);
    if (!url || typeof citation.title !== "string" || citation.title.length > 200 || typeof citation.domain !== "string" || citation.domain.length > 255 || typeof citation.accessedAt !== "string" || Number.isNaN(Date.parse(citation.accessedAt))) return { ok: false, code: "URL_INVALID" };
    source = { url: url.toString(), title: citation.title.trim(), domain: citation.domain.trim(), accessedAt: citation.accessedAt };
  }
  const questionCount = options.questionCount ?? 3;
  const questionType = options.questionType ?? "multiple_choice";
  const glossEnabled = options.glossEnabled ?? true;

  if (questionCount !== 0 && questionCount !== 3 && questionCount !== 5) return { ok: false, code: "OPTIONS_INVALID" };
  if (questionType !== "multiple_choice" && questionType !== "open_ended") return { ok: false, code: "OPTIONS_INVALID" };
  if (typeof glossEnabled !== "boolean") return { ok: false, code: "OPTIONS_INVALID" };

  return {
    ok: true,
    data: {
      sourceText: body.sourceText,
      source,
      lang: body.lang,
      targetLevels: body.targetLevels as string[],
      options: { questionCount, questionType, glossEnabled },
    },
  };
}
