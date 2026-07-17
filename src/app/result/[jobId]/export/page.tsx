"use client";

import { PDFViewer } from "@react-pdf/renderer";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { WorksheetDocument, type WorksheetLevel, type WorksheetOptions } from "@/lib/pdf/worksheet";

type ExportLevel = WorksheetLevel & { id: string; status: string };
type ExportJob = { sourceTitle: string | null; levels: Array<{ id: string; levelCode: string; levelLabel: string; status: string; result: { simplifiedText: string | null; keyPhrases: WorksheetLevel["keyPhrases"]; questions: WorksheetLevel["questions"] } }> };

export default function ExportPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<ExportJob | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [include, setInclude] = useState<WorksheetOptions>({ keyPhraseBox: true, questions: true, answerPage: true });
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();
      if (cancelled) return;
      if (!response.ok) {
        setError(data.error?.message || "Could not load export data.");
        return;
      }
      setJob(data);
      setSelected(data.levels.filter((level: ExportJob["levels"][number]) => level.status === "completed").map((level: ExportJob["levels"][number]) => level.levelCode));
    }
    void load();
    return () => { cancelled = true; };
  }, [jobId]);

  const levels = useMemo<ExportLevel[]>(() => (job?.levels ?? [])
    .filter((level) => selected.includes(level.levelCode) && level.status === "completed" && level.result.simplifiedText)
    .map((level) => ({ id: level.id, levelCode: level.levelCode, levelLabel: level.levelLabel, status: level.status, simplifiedText: level.result.simplifiedText!, keyPhrases: level.result.keyPhrases, questions: level.result.questions })), [job, selected]);

  function toggleLevel(code: string) {
    setSelected((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  }

  async function download() {
    if (levels.length === 0) return;
    setDownloading(true);
    const response = await fetch("/api/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId, levelCodes: levels.map((level) => level.levelCode), include }) });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error?.message || "Could not create PDF.");
      setDownloading(false);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "LevelLens_worksheet.pdf";
    anchor.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  }

  if (error) return <main className="min-h-screen p-6 text-red-800">{error}</main>;
  if (!job) return <main className="min-h-screen p-6">Loading...</main>;

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-stone-950">
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <header>
            <p className="text-sm text-stone-600">Export worksheet</p>
            <h1 className="text-xl font-semibold">{job.sourceTitle || "LevelLens worksheet"}</h1>
          </header>
          <div className="border-y border-stone-300 py-4">
            <p className="mb-2 text-sm font-semibold">Levels</p>
            {job.levels.map((level) => <label key={level.id} className="mb-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={selected.includes(level.levelCode)} disabled={level.status !== "completed"} onChange={() => toggleLevel(level.levelCode)} />
              <span>{level.levelLabel} {level.status !== "completed" ? "(not ready)" : ""}</span>
            </label>)}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Include</p>
            {(["keyPhraseBox", "questions", "answerPage"] as const).map((key) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={include[key]} onChange={() => setInclude((current) => ({ ...current, [key]: !current[key] }))} />{key === "keyPhraseBox" ? "Key phrase box" : key === "answerPage" ? "Answer page" : "Questions"}</label>)}
          </div>
          <button type="button" onClick={download} disabled={levels.length === 0 || downloading} className="w-full rounded bg-stone-950 px-3 py-2 text-sm text-white disabled:opacity-50">{downloading ? "Preparing PDF..." : "Download PDF"}</button>
          <Link href={`/result/${jobId}`} className="block text-sm underline">Back to results</Link>
        </aside>
        <section className="min-h-[900px] border border-stone-300 bg-stone-200 p-3">
          {levels.length > 0 ? <PDFViewer width="100%" height="900" showToolbar={false}><WorksheetDocument title={job.sourceTitle || "LevelLens worksheet"} levels={levels} include={include} /></PDFViewer> : <div className="grid h-full place-items-center bg-white text-sm text-stone-600">Select a completed level to preview.</div>}
        </section>
      </section>
    </main>
  );
}
