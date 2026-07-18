import Link from "next/link";
import { prisma } from "@/lib/db";

function titleFor(sourceTitle: string | null, sourceText: string) {
  if (sourceTitle) return sourceTitle;
  const preview = sourceText.replace(/\s+/g, " ").trim();
  return preview.length > 72 ? `${preview.slice(0, 72)}...` : preview || "Untitled material";
}

function statusLabel(status: string) {
  return status.replace("_", " ");
}

export default async function HistoryPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { levelVersions: { select: { id: true, status: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-7 lg:px-8">
      <header className="mb-6 flex items-end justify-between border-b border-stone-300 pb-4">
        <div>
          <p className="text-sm text-stone-600">Past conversions</p>
          <h1 className="text-2xl font-semibold">History</h1>
        </div>
        <Link href="/" className="rounded bg-stone-950 px-3 py-2 text-sm font-medium text-white">New material</Link>
      </header>

      {jobs.length === 0 ? (
        <section className="border border-dashed border-stone-300 bg-white p-8 text-center">
          <h2 className="font-semibold">No conversions yet</h2>
          <p className="mt-2 text-sm text-stone-600">Create a material to see its progress and completed versions here.</p>
        </section>
      ) : (
        <section className="overflow-hidden border border-stone-300 bg-white">
          <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-4 border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-600 sm:grid-cols-[minmax(0,1fr)_90px_120px_120px]">
            <span>Material</span><span className="hidden sm:block">Language</span><span className="hidden sm:block">Status</span><span>Created</span>
          </div>
          <div className="divide-y divide-stone-200">
            {jobs.map((job) => {
              const completed = job.levelVersions.filter((level) => level.status === "completed").length;
              return (
                <Link key={job.id} href={`/result/${job.id}`} className="grid grid-cols-[minmax(0,1fr)_80px] gap-4 px-4 py-4 transition-colors hover:bg-stone-50 sm:grid-cols-[minmax(0,1fr)_90px_120px_120px]">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{titleFor(job.sourceTitle, job.sourceText)}</p>
                    <p className="mt-1 text-xs text-stone-600">{completed}/{job.levelVersions.length} levels complete</p>
                  </div>
                  <span className="hidden text-sm uppercase text-stone-600 sm:block">{job.lang}</span>
                  <span className="hidden text-sm capitalize text-stone-600 sm:block">{statusLabel(job.status)}</span>
                  <time className="text-right text-xs leading-5 text-stone-600" dateTime={job.createdAt.toISOString()}>
                    {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(job.createdAt)}
                  </time>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
