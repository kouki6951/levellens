"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { LoadingState } from "@/components/loading-state";

type Question = {
  id: string;
  orderIndex: number;
  type: string;
  questionText: string;
  choices: string[] | null;
  answer: string;
  explanation: string | null;
  keyPhraseId: string | null;
};

type JobQuestions = {
  sourceTitle: string | null;
  levels: Array<{ id: string; levelCode: string; levelLabel: string; status: string; result: { questions: Question[] } }>;
};

export default function QuestionsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { t } = useLocale();
  const [job, setJob] = useState<JobQuestions | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [busyQuestion, setBusyQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadQuestions() {
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();
      if (cancelled) return;
      if (!response.ok) {
        setError(data.error?.message || t.loadQuestionsError);
        return;
      }
      setJob(data);
      setSelectedCode((current) => current || data.levels[0]?.levelCode || null);
    }
    void loadQuestions();
    return () => { cancelled = true; };
  }, [jobId, reloadVersion, t.loadQuestionsError]);

  const level = useMemo(() => job?.levels.find((item) => item.levelCode === selectedCode) || job?.levels[0], [job, selectedCode]);

  async function regenerate(questionId: string) {
    setBusyQuestion(questionId);
    const response = await fetch(`/api/questions/${questionId}/regenerate`, { method: "POST" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error?.message || t.regenerateQuestionError);
    } else {
      setReloadVersion((value) => value + 1);
    }
    setBusyQuestion(null);
  }

  if (error) return <main className="min-h-screen p-6 text-red-800">{error}</main>;
  if (!job || !level) return <main className="grid min-h-screen place-items-center p-6"><LoadingState label={t.loading} /></main>;

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-stone-950">
      <section className="mx-auto w-full max-w-5xl px-6 py-6">
        <header className="mb-5 flex items-center justify-between border-b border-stone-300 pb-4">
          <div>
            <p className="text-sm text-stone-600">{t.comprehensionQuestions}</p>
            <h1 className="text-2xl font-semibold">{job.sourceTitle || t.generatedMaterial}</h1>
          </div>
          <Link href={`/result/${jobId}`} className="rounded border border-stone-300 bg-white px-3 py-2 text-sm">{t.backToResults}</Link>
        </header>

        <nav className="mb-5 flex flex-wrap gap-2">
          {job.levels.map((item) => (
            <button key={item.levelCode} type="button" onClick={() => setSelectedCode(item.levelCode)} className={`rounded border px-3 py-2 text-sm ${level.levelCode === item.levelCode ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white"}`}>
              {item.levelLabel}
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          {level.result.questions.length === 0 ? <p className="rounded border border-stone-300 bg-white p-4 text-stone-600">{t.questionsGenerating}</p> : null}
          {level.result.questions.map((question) => (
            <article key={question.id} className="rounded border border-stone-300 bg-white p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="font-semibold">{question.orderIndex}. {question.questionText}</h2>
                {question.keyPhraseId ? <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-950">{t.keyPhrase}</span> : null}
              </div>
              {question.choices ? <ol className="mb-4 list-[upper-alpha] space-y-1 pl-6 text-sm">{question.choices.map((choice, index) => <li key={index}>{choice}</li>)}</ol> : null}
              <div className="border-t border-stone-200 pt-3 text-sm">
                <p><span className="font-medium">{t.answer}</span> {question.choices && /^\d+$/.test(question.answer) ? question.choices[Number(question.answer)] : question.answer}</p>
                {question.explanation ? <p className="mt-1 text-stone-600">{question.explanation}</p> : null}
              </div>
              <button type="button" onClick={() => regenerate(question.id)} disabled={busyQuestion === question.id} className="mt-4 rounded border border-stone-800 px-3 py-2 text-sm disabled:opacity-50">
                {busyQuestion === question.id ? t.questionRegenerating : t.regenerateQuestion}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
