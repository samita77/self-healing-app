const VARIANT: Record<string, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-border bg-card text-ink hover:bg-surface",
  ghost: "text-ink-muted hover:bg-surface hover:text-ink",
  danger: "bg-failed text-white hover:bg-failed/90",
  "danger-ghost": "text-failed hover:bg-failed-subtle",
};

const SIZE: Record<string, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Class-string helper so Link/other elements can render as a button without
 * bringing in an asChild abstraction.
 */
export function buttonClass(
  variant: keyof typeof VARIANT = "primary",
  size: keyof typeof SIZE = "md",
  className = "",
) {
  return `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`;
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANT;
  size?: keyof typeof SIZE;
  loading?: boolean;
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  type = "button",
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
