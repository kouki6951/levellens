"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { levelsForLang, type SupportedLang } from "@/lib/levels";

const SAMPLES: Record<SupportedLang, { label: string; text: string }> = {
  en: { label: "EN: City gardens", text: "In many cities, small gardens are growing on roofs, balconies, and empty lots. These gardens give people fresh food, shade, and a place to meet neighbors. Plants take in carbon dioxide and release oxygen, but they also cool the ground by shading it and by releasing water from their leaves. Students can measure soil moisture, count insects, and compare temperatures in sunny and shaded places. A garden cannot solve every city problem, yet it can help a neighborhood learn how choices about land, water, and food affect daily life." },
  ja: { label: "JA: 川の調査", text: "町の近くを流れる川は、人や生き物のくらしを支えています。学校の子どもたちは、春と秋に川の水を調べます。水の色やにおいを見て、川辺にいる魚や鳥、虫を数えます。雨がたくさん降った後は、水がにごり、ごみが遠くまで流れることがあります。調べたことを地図や表にまとめると、川の変化に気づきやすくなります。町の人もごみを減らし、水を大切に使うことで、川を守る活動に参加できます。調査の結果を発表すると、家族や地域の人にも川を守る方法が伝わります。" },
  es: { label: "ES: El mercado local", text: "En un mercado local, las familias compran frutas, verduras, pan y otros alimentos. Muchas personas conocen a quienes cultivan o preparan estos productos. Cuando los alimentos viajan una distancia corta, pueden llegar más frescos y usar menos combustible para el transporte. Sin embargo, los mercados también necesitan organizar horarios, precios justos y espacios limpios. Los estudiantes pueden investigar de dónde viene cada alimento, qué estación favorece su cultivo y cómo se puede evitar desperdiciar comida. Estas preguntas ayudan a comprender la relación entre la comunidad, el trabajo y el ambiente." },
};

export default function Home() {
  const router = useRouter();
  const { t } = useLocale();
  const [sourceText, setSourceText] = useState(SAMPLES.en.text);
  const [lang, setLang] = useState<SupportedLang>("en");
  const [confidence, setConfidence] = useState(0.98);
  const [manualLanguage, setManualLanguage] = useState(false);
  const [selected, setSelected] = useState<string[]>(["en_g2-3", "en_g4-5"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const levels = useMemo(() => levelsForLang(lang), [lang]);

  function changeLang(nextLang: SupportedLang, manual = false) {
    setLang(nextLang);
    setSelected(levelsForLang(nextLang).slice(0, 2).map((level) => level.code));
    if (manual) setManualLanguage(true);
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
      if (!manualLanguage && lang !== data.lang) changeLang(data.lang);
      setConfidence(data.confidence);
    }, 500);
    return () => window.clearTimeout(handle);
  }, [sourceText, lang, manualLanguage]);

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
      setError(data.error?.message || t.startError);
      return;
    }
    router.push(`/result/${data.jobId}`);
  }

  const invalid = sourceText.length < 200 || sourceText.length > 8000 || selected.length === 0 || submitting;

  return (
    <main>
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col gap-6 px-6 py-7 lg:px-8">
        <header className="flex items-center justify-between border-b border-stone-300 pb-4">
          <div>
            <p className="text-sm text-stone-600">{t.homeSubtitle}</p>
            <h1 className="text-2xl font-semibold">{t.newMaterial}</h1>
          </div>
          <span className="rounded border border-stone-300 bg-white px-3 py-1 text-sm">
            {t.detected(lang.toUpperCase(), Math.round(confidence * 100))}
          </span>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
          <section className="flex min-h-[560px] flex-col gap-3">
            <div className="flex items-end justify-between">
              <label className="text-sm font-medium" htmlFor="source">
                {t.teachingMaterial}
              </label>
              <span className={`text-sm ${sourceText.length > 8000 ? "text-red-700" : "text-stone-600"}`}>{sourceText.length} / 8000</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(SAMPLES) as Array<[SupportedLang, (typeof SAMPLES)[SupportedLang]]>).map(([code, sample]) => (
                <button key={code} type="button" onClick={() => { setSourceText(sample.text); changeLang(code, true); }} className="rounded border border-stone-300 bg-white px-3 py-2 text-xs">
                  {sample.label}
                </button>
              ))}
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
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">{t.language}</h2>
              <div className="grid grid-cols-3 gap-2">
                {(["en", "es", "ja"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={`h-10 rounded border text-sm font-medium ${lang === code ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white"}`}
                    onClick={() => changeLang(code, true)}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">{t.targetLevels}</h2>
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
              {submitting ? t.starting : t.convertMaterial}
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}
