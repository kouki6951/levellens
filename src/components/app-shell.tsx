"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "New material" },
  { href: "/history", label: "History" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-stone-950">
      <header className="sticky top-0 z-20 border-b border-stone-300 bg-[#f7f7f4]/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-5 lg:px-7">
          <Link href="/" className="text-lg font-semibold">LevelLens</Link>
          <p className="hidden text-sm text-stone-600 sm:block">One material, every reader.</p>
          <nav aria-label="Primary navigation" className="flex gap-1 lg:hidden">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className={`rounded px-3 py-2 text-sm ${isActive(pathname, item.href) ? "bg-stone-950 text-white" : "text-stone-700"}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden border-r border-stone-300 lg:block">
          <nav aria-label="Workspace navigation" className="sticky top-16 flex min-h-[calc(100vh-4rem)] flex-col p-4">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Workspace</p>
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href} className={`block rounded px-3 py-2 text-sm font-medium ${isActive(pathname, item.href) ? "bg-stone-950 text-white" : "text-stone-700 hover:bg-stone-200"}`}>
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="mt-auto px-3 text-xs leading-5 text-stone-500">Create level-adjusted materials and return to completed work here.</p>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
