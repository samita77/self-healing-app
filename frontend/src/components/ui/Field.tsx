import type { ReactNode } from "react";

type Props = {
  label: string;
  htmlFor: string;
  /** Shown under the control instead of hint when present. */
  error?: string;
  hint?: string;
  children: ReactNode;
};

export default function Field({ label, htmlFor, error, hint, children }: Props) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-xs text-ink-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-failed">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
