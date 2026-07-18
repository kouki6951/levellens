import Link from "next/link";

type PageStateProps = {
  title: string;
  description: string;
  tone?: "neutral" | "error";
  action?: { href: string; label: string };
};

export function PageState({ title, description, tone = "neutral", action }: PageStateProps) {
  const colors = tone === "error"
    ? "border-red-200 bg-red-50 text-red-950"
    : "border-dashed border-stone-300 bg-white text-stone-950";

  return (
    <section className={`border p-8 text-center ${colors}`} role={tone === "error" ? "alert" : undefined}>
      <h2 className="font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-stone-600">{description}</p>
      {action ? <Link href={action.href} className="mt-5 inline-block rounded bg-stone-950 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800">{action.label}</Link> : null}
    </section>
  );
}
