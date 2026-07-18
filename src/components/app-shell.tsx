"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LocaleProvider, useLocale } from "@/components/locale-provider";
import { UI_LOCALE_NAMES, type UiLocale } from "@/lib/ui-i18n";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <LocaleProvider><ShellContent>{children}</ShellContent></LocaleProvider>;
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const navigation = [
    { href: "/", label: t.newMaterial },
    { href: "/history", label: t.history },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-stone-950">
      <header className="sticky top-0 z-20 border-b border-stone-300 bg-[#f7f7f4]/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-5 lg:px-7">
          <Link href="/" aria-label="LevelLens home" className="relative h-10 w-[180px] shrink-0 overflow-hidden" title="LevelLens">
            <Image src="/images/levellens-logo.png" alt="LevelLens" width={180} height={102} priority className="absolute left-0 top-[-32px] w-[180px] max-w-none" />
          </Link>
          <p className="hidden text-sm text-stone-600 lg:block">{t.tagline}</p>
          <div className="flex items-center gap-2">
          <select aria-label="Interface language" value={locale} onChange={(event) => setLocale(event.target.value as UiLocale)} className="h-9 rounded border border-stone-300 bg-white px-2 text-sm">
            {(Object.keys(UI_LOCALE_NAMES) as UiLocale[]).map((item) => <option key={item} value={item}>{UI_LOCALE_NAMES[item]}</option>)}
          </select>
          <nav aria-label="Primary navigation" className="flex gap-1 lg:hidden">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className={`rounded px-3 py-2 text-sm ${isActive(pathname, item.href) ? "bg-stone-950 text-white" : "text-stone-700"}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          </div>
        </div>
      </header>
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden border-r border-stone-300 lg:block">
          <nav aria-label="Workspace navigation" className="sticky top-16 flex min-h-[calc(100vh-4rem)] flex-col p-4">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-stone-500">{t.workspace}</p>
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href} className={`block rounded px-3 py-2 text-sm font-medium ${isActive(pathname, item.href) ? "bg-stone-950 text-white" : "text-stone-700 hover:bg-stone-200"}`}>
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="mt-auto px-3 text-xs leading-5 text-stone-500">{t.sidebarHint}</p>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
