import { levelForCode, levelsForLang, type SupportedLang } from "@/lib/levels";

export function isSupportedLang(value: unknown): value is SupportedLang {
  return value === "en" || value === "ja" || value === "es";
}

export function validateSimplifyPayload(payload: unknown):
  | {
      ok: true;
      data: {
        sourceText: string;
        lang: SupportedLang;
        targetLevels: string[];
        options: { questionCount: 0 | 3 | 5; questionType: "multiple_choice" | "open_ended"; glossEnabled: boolean };
      };
    }
  | { ok: false; code: "TEXT_LENGTH_INVALID" | "LANG_INVALID" | "LEVELS_INVALID" | "OPTIONS_INVALID" } {
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
      lang: body.lang,
      targetLevels: body.targetLevels as string[],
      options: { questionCount, questionType, glossEnabled },
    },
  };
}
