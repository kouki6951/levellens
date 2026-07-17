"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type JobResponse = {
  jobId: string;
  status: string;
  sourceTitle: string | null;
  lang: string;
  levels: Array<{
    levelCode: string;
    levelLabel: string;
    status: string;
    progress: { step: string; attempt: number; maxAttempts: number };
    result?: {
      simplifiedText: string;
      readability: {
        metric: string;
        score: number;
        targetMin: number;
        targetMax: number;
        inRange: boolean;
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

type LevelResult = NonNullable<JobResponse["levels"][number]["result"]>;

function highlightedText(text: string, phrases: LevelResult["keyPhrases"]) {
  const ordered = [...phrases].sort((a, b) => a.charStart - b.charStart);
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const phrase of ordered) {
    if (phrase.charStart < cursor) continue;
    parts.push(text.slice(cursor, phrase.charStart));
    parts.push(
      <mark key={phrase.id} className="rounded bg-amber-200 px-1" title={phrase.gloss}>
        {text.slice(phrase.charStart, phrase.charEnd)}
      </mark>,
    );
    cursor = phrase.charEnd;
  }
  parts.push(text.slice(cursor));
  return parts;
}

export default function ResultPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const [job, setJob] = useState<JobResponse | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;

    async function load() {
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();
      if (cancelled) return;
      if (!response.ok) {
        setError(data.error?.message || "Could not load job.");
        return;
      }
      setJob(data);
      setSelectedCode((current) => current || data.levels[0]?.levelCode || null);
    }

    load();
    const interval = window.setInterval(load, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [jobId]);

  const selectedLevel = useMemo(() => job?.levels.find((level) => level.levelCode === selectedCode) || job?.levels[0], [job, selectedCode]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f7f4] p-6 text-stone-950">
        <p className="rounded border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>
      </main>
    );
  }

  if (!job || !selectedLevel) {
    return <main className="min-h-screen bg-[#f7f7f4] p-6 text-stone-950">Loading...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-stone-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-6">
        <header className="flex items-center justify-between border-b border-stone-300 pb-4">
          <div>
            <p className="text-sm text-stone-600">{job.lang.toUpperCase()} material</p>
            <h1 className="text-2xl font-semibold">{job.sourceTitle || "Generated versions"}</h1>
          </div>
          <Link href="/" className="rounded border border-stone-300 bg-white px-3 py-2 text-sm">
            New material
          </Link>
        </header>

        <nav className="flex flex-wrap gap-2">
          {job.levels.map((level) => (
            <button
              key={level.levelCode}
              type="button"
              onClick={() => setSelectedCode(level.levelCode)}
              className={`rounded border px-3 py-2 text-sm ${selectedLevel.levelCode === level.levelCode ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white"}`}
            >
              {level.levelLabel} · {level.status} · try {level.progress.attempt}/{level.progress.maxAttempts}
            </button>
          ))}
        </nav>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,11fr)_minmax(360px,9fr)]">
          <article className="min-h-[540px] rounded border border-stone-300 bg-white p-5 text-lg leading-8">
            {selectedLevel.result ? highlightedText(selectedLevel.result.simplifiedText, selectedLevel.result.keyPhrases) : (
              <div className="text-stone-600">
                {selectedLevel.progress.step} in progress, attempt {selectedLevel.progress.attempt}/{selectedLevel.progress.maxAttempts}
              </div>
            )}
          </article>

          <aside className="space-y-4">
            <section className="rounded border border-stone-300 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-600">Readability</h2>
              {selectedLevel.result ? (
                <p className="text-sm">
                  {selectedLevel.result.readability.metric} {selectedLevel.result.readability.score?.toFixed(2)}{" "}
                  {selectedLevel.result.readability.inRange ? "in range" : "near match"} (target {selectedLevel.result.readability.targetMin}-
                  {selectedLevel.result.readability.targetMax}, {selectedLevel.result.readability.attemptCount} attempts)
                </p>
              ) : (
                <p className="text-sm text-stone-600">Waiting for deterministic verification.</p>
              )}
            </section>

            {selectedLevel.result?.factCheck ? (
              <section className="rounded border border-stone-300 bg-white p-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-600">Fact consistency</h2>
                <p className="mb-3 text-sm">
                  Retained {selectedLevel.result.factCheck.retained} / Simplified {selectedLevel.result.factCheck.simplified} / Lost{" "}
                  {selectedLevel.result.factCheck.lost}
                </p>
                <ul className="space-y-2 text-sm">
                  {selectedLevel.result.factCheck.items.slice(0, 5).map((item, index) => (
                    <li key={`${item.fact}-${index}`} className="border-t border-stone-200 pt-2">
                      <span className="font-medium">{item.status}</span>: {item.fact}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {selectedLevel.result ? (
              <section className="rounded border border-stone-300 bg-white p-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-600">Key phrases</h2>
                <div className="space-y-3">
                  {selectedLevel.result.keyPhrases.map((phrase) => (
                    <div key={phrase.id} className="text-sm">
                      <p className="font-medium">{phrase.phrase}</p>
                      <p className="text-stone-600">{phrase.gloss}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {selectedLevel.result ? (
              <section className="rounded border border-stone-300 bg-white p-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-600">Questions</h2>
                <ol className="space-y-3 text-sm">
                  {selectedLevel.result.questions.map((question) => (
                    <li key={question.id}>
                      <p className="font-medium">{question.questionText}</p>
                      {question.choices ? <p className="text-stone-600">{question.choices.join(" / ")}</p> : null}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
