import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-cream-soft/60 px-6 py-14 text-center">
      <p className="font-serif text-lg font-bold text-ink">{title}</p>
      <p className="text-sm text-ink-soft whitespace-pre-line">{description}</p>
      {action}
    </div>
  );
}
