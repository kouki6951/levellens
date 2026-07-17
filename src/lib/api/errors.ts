import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "TEXT_LENGTH_INVALID"
  | "LANG_INVALID"
  | "LEVELS_INVALID"
  | "OPTIONS_INVALID"
  | "JOB_NOT_FOUND"
  | "LEVEL_NOT_FOUND"
  | "LEVEL_NOT_READY"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "LLM_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  TEXT_LENGTH_INVALID: 400,
  LANG_INVALID: 400,
  LEVELS_INVALID: 400,
  OPTIONS_INVALID: 400,
  JOB_NOT_FOUND: 404,
  LEVEL_NOT_FOUND: 404,
  LEVEL_NOT_READY: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  LLM_ERROR: 502,
};

const MESSAGE_BY_CODE: Record<ApiErrorCode, string> = {
  TEXT_LENGTH_INVALID: "Text must be 200-8000 characters.",
  LANG_INVALID: "Language must be en, ja, or es.",
  LEVELS_INVALID: "Target levels must match the selected language.",
  OPTIONS_INVALID: "Options are invalid.",
  JOB_NOT_FOUND: "Job not found.",
  LEVEL_NOT_FOUND: "Level not found.",
  LEVEL_NOT_READY: "Level is not ready.",
  RATE_LIMITED: "Too many requests.",
  INTERNAL_ERROR: "Unexpected server error.",
  LLM_ERROR: "OpenAI request failed.",
};

export function apiError(code: ApiErrorCode, message = MESSAGE_BY_CODE[code]) {
  return NextResponse.json({ error: { code, message } }, { status: STATUS_BY_CODE[code] });
}
