"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { LoadingState } from "@/components/loading-state";
import { PageState } from "@/components/page-state";
import { UI_FEEDBACK } from "@/lib/ui-feedback";

type JobResponse = {
  jobId: string;
  status: string;
  sourceTitle: string | null;
  source: { url: string; domain: string | null; accessedAt: string | null } | null;
  sourceText: string;
  lang: string;
  levels: Array<{
    id: string;
    levelCode: string;
    levelLabel: string;
    status: string;
    progress: { step: string; attempt: number; maxAttempts: number };
    result: {
      title: string | null;
      simplifiedText: string | null;
      readability: {
        metric: string | null;
        score: number | null;
        targetMin: number | null;
        targetMax: number | null;
        inRange: boolean | null;
        attemptCount: number;
      };
      factCheck: {
        retained: number;
        simplified: number;
        lost: number;
        items: Array<{ fact: string; status: string; note: string }>;
      } | null;
      keyPhrases: Array<{ id: string; position: number; phrase: string; charStart: number; charEnd: number; gloss: string }>;
      questions: Array<{
        id: string;
        orderIndex: number;
        type: string;
        questionText: string;
        choices: string[] | null;
        answer: string;
        explanation: string | null;
        keyPhraseId: string | null;
      }>;
    };
  }>;
};

type LevelResult = JobResponse["levels"][number]["result"];

function highlightedText(text: string, phrases: LevelResult["keyPhrases"]) {
  const ordered = [...phrases].sort((a, b) => a.charStart - b.charStart);
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const phrase of ordered) {
    if (phrase.charStart < cursor) continue;
    parts.push(text.slice(cursor, phrase.charStart));
    parts.push(
      <mark id={`key-phrase-${phrase.id}`} key={phrase.id} className="rounded bg-amber-200 px-1 transition-colors" title={phrase.gloss}>
        {text.slice(phrase.charStart, phrase.charEnd)}
      </mark>,
    );
    cursor = phrase.charEnd;
  }
  parts.push(text.slice(cursor));
  return parts;
}

function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={`h-3 animate-pulse rounded bg-stone-200 ${index === rows - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export default function ResultPage() {
  const params = useParams<{ jobId: string }>();
  const { locale, t } = useLocale();
  const feedback = UI_FEEDBACK[locale];
  const jobId = params.jobId;
  const [job, setJob] = useState<JobResponse | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollKey, setPollKey] = useState(0);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;

    async function load() {
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();
      if (cancelled) return;
      if (!response.ok) {
        setError(data.error?.message || t.loading);
        return;
      }
      setJob(data);
      setSelectedCode((current) => current && data.levels.some((level: JobResponse["levels"][number]) => level.levelCode === current) ? current : data.levels[0]?.levelCode || null);
      if (["completed", "partially_failed", "failed"].includes(data.status)) {
        window.clearInterval(interval);
      }
    }

    const interval = window.setInterval(load, 2000);
    load();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [jobId, pollKey, t.loading]);

  const selectedLevel = useMemo(() => job?.levels.find((level) => level.levelCode === selectedCode) || job?.levels[0], [job, selectedCode]);
  const levelIsActive = selectedLevel ? !["completed", "failed"].includes(selectedLevel.status) : false;
  const displayTitle = selectedLevel?.result.title || (job?.sourceTitle && selectedLevel ? `${job.sourceTitle} - ${selectedLevel.levelLabel}` : job?.sourceTitle || t.generatedVersions);

  async function regenerateLevel() {
    if (!selectedLevel) return;
    setRegenerating(true);
    const response = await fetch(`/api/levels/${selectedLevel.id}/regenerate`, { method: "POST" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error?.message || t.regenerateLevel);
      setRegenerating(false);
      return;
    }
    setPollKey((value) => value + 1);
    setRegenerating(false);
  }

  function focusKeyPhrase(id: string) {
    const element = document.getElementById(`key-phrase-${id}`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("bg-amber-400", "ring-2", "ring-amber-500");
    window.setTimeout(() => element.classList.remove("bg-amber-400", "ring-2", "ring-amber-500"), 900);
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f7f4] p-6 text-stone-950">
        <PageState title={feedback.resultUnavailable} description={error || feedback.resultUnavailableBody} tone="error" action={{ href: "/history", label: t.history }} />
      </main>
    );
  }

  if (!job || !selectedLevel) {
    return <main className="grid min-h-screen place-items-center bg-[#f7f7f4] p-6 text-stone-950"><LoadingState label={t.loading} /></main>;
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-stone-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-6">
        <header className="flex flex-col gap-4 border-b border-stone-300 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-stone-600">{job.lang.toUpperCase()} {t.material.toLowerCase()}</p>
            <h1 className="text-2xl font-semibold">{displayTitle}</h1>
            {job.source ? <a className="mt-1 block max-w-xl truncate text-sm text-stone-600 underline" href={job.source.url} target="_blank" rel="noreferrer">Source: {job.source.domain || job.source.url}</a> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label="Result actions">
            <div className="flex gap-2">
              <Link href={`/result/${jobId}/questions`} className="rounded border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-100">{t.questions}</Link>
              <Link href={`/result/${jobId}/export`} className="rounded border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-100">{t.export}</Link>
            </div>
            <Link href="/" className="rounded bg-stone-950 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800">{t.newMaterial}</Link>
          </div>
        </header>

        <nav className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {job.levels.map((level) => (
            <button
              key={level.levelCode}
              type="button"
              onClick={() => setSelectedCode(level.levelCode)}
              title={`${level.levelLabel} - ${t.statusName(level.status)} - ${level.progress.attempt}/${level.progress.maxAttempts}`}
              className={`h-11 min-w-0 overflow-hidden rounded border px-3 text-left text-sm ${selectedLevel.levelCode === level.levelCode ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white"}`}
            >
              {level.levelLabel} · {t.statusName(level.status)} · {level.progress.attempt}/{level.progress.maxAttempts}
            </button>
          ))}
        </nav>

        <div className="grid gap-5 lg:grid-cols-2">
          <article className="h-[520px] overflow-y-auto rounded border border-stone-300 bg-white p-5 text-base leading-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-600">{t.originalText}</h2>
            {job.sourceText}
          </article>
          <article className="h-[520px] overflow-y-auto rounded border border-stone-300 bg-white p-5 text-base leading-8">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div><h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">{t.simplifiedText}</h2><p className="mt-1 text-sm font-medium text-stone-900">{selectedLevel.levelLabel}</p></div>
              {(selectedLevel.status === "failed" || (selectedLevel.status === "completed" && selectedLevel.result.readability.inRange === false)) ? <button type="button" onClick={regenerateLevel} disabled={regenerating} className="shrink-0 rounded border border-stone-800 px-3 py-2 text-sm disabled:opacity-50">{regenerating ? t.regenerating : t.regenerateLevel}</button> : null}
            </div>
            {levelIsActive ? <div className="mb-4 flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-300 border-t-amber-800" />{t.inProgress(t.stepName(selectedLevel.progress.step), selectedLevel.progress.attempt, selectedLevel.progress.maxAttempts)}</div> : null}
            {selectedLevel.result.simplifiedText ? highlightedText(selectedLevel.result.simplifiedText, selectedLevel.result.keyPhrases) : (
              <div className="text-stone-600">
                {selectedLevel.status === "failed"
                  ? t.failedAfter(selectedLevel.progress.attempt, selectedLevel.progress.maxAttempts)
                  : <><span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />{t.inProgress(t.stepName(selectedLevel.progress.step), selectedLevel.progress.attempt, selectedLevel.progress.maxAttempts)}</>}
              </div>
            )}
          </article>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <section className="rounded border border-stone-300 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-600">{t.readability}</h2>
            {selectedLevel.result.readability.score !== null ? <><span className={`inline-block rounded px-2 py-1 text-xs font-medium ${selectedLevel.result.readability.inRange ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}`}>{selectedLevel.result.readability.inRange ? feedback.targetReached : feedback.targetOutside}</span><p className="mt-3 text-sm">{selectedLevel.result.readability.metric} {selectedLevel.result.readability.score?.toFixed(2)}</p><p className="mt-1 text-xs text-stone-600">{t.target} {selectedLevel.result.readability.targetMin}-{selectedLevel.result.readability.targetMax} · {selectedLevel.result.readability.attemptCount} {t.attempts}</p></> : <><p className="mb-3 text-xs text-stone-600">{feedback.scorePending}</p><LoadingRows rows={2} /></>}
          </section>
          <section className="rounded border border-stone-300 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-600">{t.factConsistency}</h2>
            {selectedLevel.result.factCheck ? <><span className={`inline-block rounded px-2 py-1 text-xs font-medium ${selectedLevel.result.factCheck.lost > 0 ? "bg-amber-100 text-amber-950" : "bg-emerald-100 text-emerald-900"}`}>{selectedLevel.result.factCheck.lost > 0 ? feedback.factsNeedReview(selectedLevel.result.factCheck.lost) : feedback.factsRetained}</span><p className="mt-3 text-sm">{t.retained} {selectedLevel.result.factCheck.retained} / {t.simplified} {selectedLevel.result.factCheck.simplified} / {t.lost} {selectedLevel.result.factCheck.lost}</p><details className="mt-3 text-sm"><summary className="cursor-pointer font-medium text-stone-700">{t.showDetails}</summary><ul className="mt-3 space-y-2">{selectedLevel.result.factCheck.items.slice(0, 5).map((item, index) => <li key={`${item.fact}-${index}`} className="border-t border-stone-200 pt-2"><span className="font-medium">{item.status}</span>: {item.fact}</li>)}</ul></details></> : <LoadingRows rows={3} />}
          </section>
          <section className="rounded border border-stone-300 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-600">{t.keyPhrases}</h2>
            {selectedLevel.result.keyPhrases.length > 0 ? <div className="space-y-3">{selectedLevel.result.keyPhrases.map((phrase) => <button key={phrase.id} type="button" className="block w-full cursor-pointer text-left text-sm" onClick={() => focusKeyPhrase(phrase.id)}><span className="block font-medium">{phrase.phrase}</span><span className="block text-stone-600">{phrase.gloss}</span></button>)}</div> : <LoadingRows rows={3} />}
          </section>
          <section className="rounded border border-stone-300 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-600">{t.questionLabel}</h2>
            {selectedLevel.result.questions.length > 0 ? <ol className="space-y-4 text-sm">{selectedLevel.result.questions.map((question) => <li key={question.id} className="border-t border-stone-200 pt-3 first:border-t-0 first:pt-0"><p className="mb-2 font-medium">{question.orderIndex}. {question.questionText}</p>{question.choices ? <ol className="space-y-1 text-stone-600">{question.choices.map((choice, index) => <li key={index}><span className="mr-1 font-medium text-stone-900">{String.fromCharCode(65 + index)}.</span>{choice}</li>)}</ol> : null}</li>)}</ol> : <LoadingRows rows={3} />}
          </section>
        </div>
      </section>
    </main>
  );
}
