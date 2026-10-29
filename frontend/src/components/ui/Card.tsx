import type { HTMLAttributes, ReactNode } from "react";

export default function Card({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`rounded-xl border border-border bg-card shadow-sm ${className}`} {...props}>{children}</section>;
}
export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`border-b border-border px-4 py-3 ${className}`}>{children}</div>; }
export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`p-4 ${className}`}>{children}</div>; }
export function CardFooter({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`border-t border-border px-4 py-3 ${className}`}>{children}</div>; }
