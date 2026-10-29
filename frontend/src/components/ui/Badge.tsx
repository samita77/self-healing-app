import type { ReactNode } from "react";

const styles = {
  neutral: "bg-neutral-subtle text-ink ring-border",
  healthy: "bg-healthy-subtle text-healthy ring-healthy/30",
  warning: "bg-warning-subtle text-warning ring-warning/30",
  failed: "bg-failed-subtle text-failed ring-failed/30",
  info: "bg-primary-subtle text-primary ring-primary/30",
} as const;

export type BadgeVariant = keyof typeof styles;
export default function Badge({ children, variant = "neutral", className = "" }: { children: ReactNode; variant?: BadgeVariant; className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[variant]} ${className}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{children}</span>;
}
