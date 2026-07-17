"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { levelsForLang, type SupportedLang } from "@/lib/levels";

const SAMPLE = `The water cycle describes how water moves around Earth. Heat from the sun warms water in oceans, lakes, and rivers. Some of the water evaporates and becomes water vapor in the air. As the vapor rises, it cools and forms clouds. When the drops in clouds become heavy, they fall as rain or snow. This process helps move fresh water to plants, animals, and people.`;

export default function Home() {
  const router = useRouter();
  const [sourceText, setSourceText] = useState(SAMPLE);
  const [lang, setLang] = useState<SupportedLang>("en");
  const [confidence, setConfidence] = useState(0.98);
  const [selected, setSelected] = useState<string[]>(["en_g2-3", "en_g4-5"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const levels = useMemo(() => levelsForLang(lang), [lang]);

  function changeLang(nextLang: SupportedLang) {
    setLang(nextLang);
    setSelected(levelsForLang(nextLang).slice(0, 2).map((level) => level.code));
  }

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      if (sourceText.trim().length < 40) return;
      const response = await fetch("/api/detect-lang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { lang: SupportedLang; confidence: number };
      if (lang !== data.lang) changeLang(data.lang);
      setConfidence(data.confidence);
    }, 500);
    return () => window.clearTimeout(handle);
  }, [sourceText, lang]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const response = await fetch("/api/simplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceText,
        lang,
        targetLevels: selected,
        options: { questionCount: 3, questionType: "multiple_choice", glossEnabled: true },
      }),
    });
    const data = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setError(data.error?.message || "Could not start simplification.");
      return;
    }
    router.push(`/result/${data.jobId}`);
  }

  const invalid = sourceText.length < 200 || sourceText.length > 8000 || selected.length === 0 || submitting;

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-stone-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-6">
        <header className="flex items-center justify-between border-b border-stone-300 pb-4">
          <div>
            <h1 className="text-2xl font-semibold">LevelLens</h1>
            <p className="text-sm text-stone-600">One material, every reader.</p>
          </div>
          <span className="rounded border border-stone-300 bg-white px-3 py-1 text-sm">
            {lang.toUpperCase()} detected {Math.round(confidence * 100)}%
          </span>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
          <section className="flex min-h-[560px] flex-col gap-3">
            <div className="flex items-end justify-between">
              <label className="text-sm font-medium" htmlFor="source">
                Teaching material
              </label>
              <span className={`text-sm ${sourceText.length > 8000 ? "text-red-700" : "text-stone-600"}`}>{sourceText.length} / 8000</span>
            </div>
            <textarea
              id="source"
              className="min-h-[520px] flex-1 resize-none rounded border border-stone-300 bg-white p-4 text-base leading-7 outline-none focus:border-stone-700"
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
            />
          </section>

          <aside className="flex flex-col gap-6 border-l border-stone-300 pl-0 lg:pl-6">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">Language</h2>
              <div className="grid grid-cols-3 gap-2">
                {(["en", "ja", "es"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={`h-10 rounded border text-sm font-medium ${lang === code ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white"}`}
                    onClick={() => changeLang(code)}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">Target levels</h2>
              <div className="grid gap-2">
                {levels.map((level) => {
                  const active = selected.includes(level.code);
                  return (
                    <button
                      key={level.code}
                      type="button"
                      className={`flex h-12 items-center justify-between rounded border px-3 text-left text-sm ${active ? "border-emerald-800 bg-emerald-50" : "border-stone-300 bg-white"}`}
                      onClick={() =>
                        setSelected((current) =>
                          active ? current.filter((code) => code !== level.code) : current.length >= 4 ? current : [...current, level.code],
                        )
                      }
                    >
                      <span className="font-medium">{level.label}</span>
                      <span className="text-stone-600">
                        {level.targetMin}-{level.targetMax}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
            <button
              type="button"
              disabled={invalid}
              onClick={submit}
              className="mt-auto h-12 rounded bg-stone-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              {submitting ? "Starting..." : "Convert material"}
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}
