export function LoadingState({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-sm text-stone-600 ${className}`} role="status" aria-live="polite">
      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
