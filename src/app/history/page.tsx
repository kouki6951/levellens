"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { LoadingState } from "@/components/loading-state";
import { PageState } from "@/components/page-state";
import { UI_FEEDBACK } from "@/lib/ui-feedback";

type HistoryJob = { id: string; sourceTitle: string | null; sourceText: string; lang: string; status: string; createdAt: string; completedLevels: number; levelCount: number; levelCodes: string[]; levels: Array<{ levelCode: string; levelLabel: string; status: string }> };
const DRAFT_STORAGE_KEY = "levellens-reuse-draft";

function titleFor(sourceTitle: string | null, sourceText: string, fallback: string) {
  if (sourceTitle) return sourceTitle;
  const preview = sourceText.replace(/\s+/g, " ").trim();
  return preview.length > 72 ? `${preview.slice(0, 72)}...` : preview || fallback;
}

export default function HistoryPage() {
  const { locale, t } = useLocale();
  const feedback = UI_FEEDBACK[locale];
  const [jobs, setJobs] = useState<HistoryJob[] | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => { void fetch("/api/history").then((response) => response.ok ? response.json() : []).then(setJobs); }, []);

  const filteredJobs = useMemo(() => (jobs ?? []).filter((job) => {
    const matchingText = `${job.sourceTitle ?? ""} ${job.sourceText}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchingText && (status === "all" || job.status === status);
  }), [jobs, query, status]);
  const statuses = useMemo(() => [...new Set((jobs ?? []).map((job) => job.status))], [jobs]);

  function reuse(job: HistoryJob) {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ sourceText: job.sourceText, lang: job.lang, targetLevels: job.levelCodes }));
    window.location.assign("/");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-7 lg:px-8">
      <header className="mb-6 flex items-end justify-between border-b border-stone-300 pb-4">
        <div><p className="text-sm text-stone-600">{t.pastConversions}</p><h1 className="text-2xl font-semibold">{t.history}</h1></div>
        <Link href="/" className="rounded bg-stone-950 px-3 py-2 text-sm font-medium text-white">{t.newMaterial}</Link>
      </header>
      {jobs === null ? <LoadingState label={t.loading} /> : jobs.length === 0 ? (
        <PageState title={t.noConversions} description={t.noConversionsHint} action={{ href: "/", label: feedback.noHistoryAction }} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchHistory} className="h-10 min-w-0 flex-1 rounded border border-stone-300 bg-white px-3 text-sm outline-none focus:border-stone-700" />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded border border-stone-300 bg-white px-3 text-sm">
              <option value="all">{t.allStatuses}</option>
              {statuses.map((item) => <option key={item} value={item}>{t.statusName(item)}</option>)}
            </select>
          </div>
          {filteredJobs.length === 0 ? <PageState title={t.noMatchingHistory} description={t.noMatchingHistory} action={{ href: "/history", label: feedback.noResultsAction }} /> : <section className="overflow-hidden border border-stone-300 bg-white">
            <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-4 border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-600 sm:grid-cols-[minmax(0,1fr)_90px_120px_150px]"><span>{t.material}</span><span className="hidden sm:block">{t.language}</span><span className="hidden sm:block">{t.status}</span><span>{t.created}</span></div>
            <div className="divide-y divide-stone-200">
              {filteredJobs.map((job) => <article key={job.id} className="grid grid-cols-[minmax(0,1fr)_80px] gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_90px_120px_150px]">
                <div className="min-w-0"><Link href={`/result/${job.id}`} className="block truncate font-medium hover:underline">{titleFor(job.sourceTitle, job.sourceText, t.untitledMaterial)}</Link><div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded bg-stone-100 px-2 py-1 text-xs font-medium uppercase text-stone-700 sm:hidden">{job.lang}</span><span className={`rounded px-2 py-1 text-xs font-medium ${job.status === "completed" ? "bg-emerald-100 text-emerald-900" : job.status === "failed" || job.status === "partially_failed" ? "bg-red-100 text-red-900" : "bg-amber-100 text-amber-900"}`}>{t.statusName(job.status)}</span><p className="text-xs text-stone-600">{t.levelsComplete(job.completedLevels, job.levelCount)}</p><button type="button" onClick={() => reuse(job)} className="text-xs font-medium underline">{t.reuseMaterial}</button></div><p className="mt-2 truncate text-xs text-stone-600">{job.levels.map((level) => level.levelLabel).join(" · ")}</p></div>
                <span className="hidden text-sm uppercase text-stone-600 sm:block">{job.lang}</span><span className="hidden text-sm text-stone-600 sm:block">{t.statusName(job.status)}</span>
                <time className="text-right text-xs leading-5 text-stone-600" dateTime={job.createdAt}>{new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(job.createdAt))}</time>
              </article>)}
            </div>
          </section>}
        </>
      )}
    </main>
  );
}
