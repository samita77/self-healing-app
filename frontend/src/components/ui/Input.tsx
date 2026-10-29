export const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...rest }: Props) {
  return <input className={`${inputClass} ${className}`} {...rest} />;
}
