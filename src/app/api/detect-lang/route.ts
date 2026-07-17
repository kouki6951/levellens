import { franc } from "franc";
import { NextResponse } from "next/server";

function mapFranc(code: string) {
  if (code === "eng") return "en";
  if (code === "spa") return "es";
  if (code === "jpn") return "ja";
  return null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { text?: string };
  const sample = (body.text || "").slice(0, 500);
  if (!sample.trim()) return NextResponse.json({ lang: "en", confidence: 0 });

  if (/[\u3040-\u30ff\u3400-\u9fff]/.test(sample)) {
    return NextResponse.json({ lang: "ja", confidence: 0.98 });
  }

  const detected = franc(sample, { only: ["eng", "spa", "jpn"] });
  const lang = mapFranc(detected) || "en";
  const confidence = detected === "und" ? 0.4 : 0.9;
  return NextResponse.json({ lang, confidence });
}
