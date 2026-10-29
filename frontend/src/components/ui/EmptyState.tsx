import type { ReactNode } from "react";
export default function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center"><p className="text-sm font-semibold text-ink">{title}</p>{description && <p className="mt-1 max-w-md text-sm text-ink-muted">{description}</p>}{action && <div className="mt-4">{action}</div>}</div>;
}
