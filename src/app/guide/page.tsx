"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { GUIDE_CONTENT } from "@/lib/guide-content";

export default function GuidePage() {
  const { locale } = useLocale();
  const guide = GUIDE_CONTENT[locale];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-7 lg:px-8">
      <header className="border-b border-stone-300 pb-6">
        <p className="text-sm text-stone-600">{guide.eyebrow}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-2xl font-semibold">{guide.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{guide.intro}</p></div>
          <Link href="/" className="rounded bg-stone-950 px-3 py-2 text-sm font-medium text-white">{guide.startLabel}</Link>
        </div>
      </header>

      <div className="mt-7 grid gap-8 lg:grid-cols-[170px_minmax(0,1fr)]">
        <nav aria-label={guide.title} className="hidden lg:block">
          <ol className="sticky top-24 space-y-1 border-l border-stone-300">
            {guide.sections.map((section) => <li key={section.step}><a href={`#guide-${section.step}`} className="block px-3 py-2 text-sm text-stone-600 hover:bg-stone-200 hover:text-stone-950"><span className="mr-2 text-xs">{section.step}</span>{section.title}</a></li>)}
          </ol>
        </nav>
        <div className="divide-y divide-stone-300 border-t border-stone-300">
          {guide.sections.map((section) => (
            <section key={section.step} id={`guide-${section.step}`} className="grid gap-4 py-7 sm:grid-cols-[70px_minmax(0,1fr)]">
              <p className="text-sm font-semibold text-stone-500">{section.step}</p>
              <div><h2 className="text-lg font-semibold">{section.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">{section.body}</p><ul className="mt-4 space-y-2 text-sm leading-6 text-stone-600">{section.bullets.map((bullet) => <li key={bullet} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-500" aria-hidden="true" />{bullet}</li>)}</ul></div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
