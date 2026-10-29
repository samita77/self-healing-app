export default function Spinner({ label = "Loading…", className = "" }: { label?: string; className?: string }) {
  return <span role="status" className={`inline-flex items-center gap-2 text-sm text-ink-muted ${className}`}><span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary motion-reduce:animate-none" />{label}</span>;
}
