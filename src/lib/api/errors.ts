import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "TEXT_LENGTH_INVALID"
  | "LANG_INVALID"
  | "LEVELS_INVALID"
  | "OPTIONS_INVALID"
  | "URL_INVALID"
  | "URL_FETCH_FAILED"
  | "URL_CONTENT_UNSUPPORTED"
  | "URL_CONTENT_TOO_LARGE"
  | "JOB_NOT_FOUND"
  | "LEVEL_NOT_FOUND"
  | "LEVEL_NOT_READY"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR"
  | "LLM_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  TEXT_LENGTH_INVALID: 400,
  LANG_INVALID: 400,
  LEVELS_INVALID: 400,
  OPTIONS_INVALID: 400,
  URL_INVALID: 400,
  URL_FETCH_FAILED: 422,
  URL_CONTENT_UNSUPPORTED: 422,
  URL_CONTENT_TOO_LARGE: 422,
  JOB_NOT_FOUND: 404,
  LEVEL_NOT_FOUND: 404,
  LEVEL_NOT_READY: 409,
  RATE_LIMITED: 429,
  UNAUTHORIZED: 401,
  INTERNAL_ERROR: 500,
  LLM_ERROR: 502,
};

const MESSAGE_BY_CODE: Record<ApiErrorCode, string> = {
  TEXT_LENGTH_INVALID: "Text must be 200-8000 characters.",
  LANG_INVALID: "Language must be en, ja, or es.",
  LEVELS_INVALID: "Target levels must match the selected language.",
  OPTIONS_INVALID: "Options are invalid.",
  URL_INVALID: "Enter a public HTTP(S) article URL.",
  URL_FETCH_FAILED: "The article could not be retrieved.",
  URL_CONTENT_UNSUPPORTED: "Only publicly accessible HTML articles can be imported.",
  URL_CONTENT_TOO_LARGE: "The article is too large to import.",
  JOB_NOT_FOUND: "Job not found.",
  LEVEL_NOT_FOUND: "Level not found.",
  LEVEL_NOT_READY: "Level is not ready.",
  RATE_LIMITED: "Too many requests.",
  UNAUTHORIZED: "Unauthorized.",
  INTERNAL_ERROR: "Unexpected server error.",
  LLM_ERROR: "OpenAI request failed.",
};

export function apiError(code: ApiErrorCode, message = MESSAGE_BY_CODE[code]) {
  return NextResponse.json({ error: { code, message } }, { status: STATUS_BY_CODE[code] });
}
