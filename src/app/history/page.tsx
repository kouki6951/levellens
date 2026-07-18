"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";

type HistoryJob = { id: string; sourceTitle: string | null; sourceText: string; lang: string; status: string; createdAt: string; completedLevels: number; levelCount: number };

function titleFor(sourceTitle: string | null, sourceText: string, fallback: string) {
  if (sourceTitle) return sourceTitle;
  const preview = sourceText.replace(/\s+/g, " ").trim();
  return preview.length > 72 ? `${preview.slice(0, 72)}...` : preview || fallback;
}

export default function HistoryPage() {
  const { locale, t } = useLocale();
  const [jobs, setJobs] = useState<HistoryJob[] | null>(null);

  useEffect(() => { void fetch("/api/history").then((response) => response.ok ? response.json() : []).then(setJobs); }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-7 lg:px-8">
      <header className="mb-6 flex items-end justify-between border-b border-stone-300 pb-4">
        <div><p className="text-sm text-stone-600">{t.pastConversions}</p><h1 className="text-2xl font-semibold">{t.history}</h1></div>
        <Link href="/" className="rounded bg-stone-950 px-3 py-2 text-sm font-medium text-white">{t.newMaterial}</Link>
      </header>
      {jobs === null ? <p className="text-sm text-stone-600">{t.loading}</p> : jobs.length === 0 ? (
        <section className="border border-dashed border-stone-300 bg-white p-8 text-center"><h2 className="font-semibold">{t.noConversions}</h2><p className="mt-2 text-sm text-stone-600">{t.noConversionsHint}</p></section>
      ) : (
        <section className="overflow-hidden border border-stone-300 bg-white">
          <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-4 border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-600 sm:grid-cols-[minmax(0,1fr)_90px_120px_120px]"><span>{t.material}</span><span className="hidden sm:block">{t.language}</span><span className="hidden sm:block">{t.status}</span><span>{t.created}</span></div>
          <div className="divide-y divide-stone-200">
            {jobs.map((job) => <Link key={job.id} href={`/result/${job.id}`} className="grid grid-cols-[minmax(0,1fr)_80px] gap-4 px-4 py-4 transition-colors hover:bg-stone-50 sm:grid-cols-[minmax(0,1fr)_90px_120px_120px]">
              <div className="min-w-0"><p className="truncate font-medium">{titleFor(job.sourceTitle, job.sourceText, t.untitledMaterial)}</p><p className="mt-1 text-xs text-stone-600">{t.levelsComplete(job.completedLevels, job.levelCount)}</p></div>
              <span className="hidden text-sm uppercase text-stone-600 sm:block">{job.lang}</span><span className="hidden text-sm text-stone-600 sm:block">{t.statusName(job.status)}</span>
              <time className="text-right text-xs leading-5 text-stone-600" dateTime={job.createdAt}>{new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(job.createdAt))}</time>
            </Link>)}
          </div>
        </section>
      )}
    </main>
  );
}
