import type { HTMLAttributes, TableHTMLAttributes } from "react";
export function Table({ className = "", ...props }: TableHTMLAttributes<HTMLTableElement>) { return <div className="w-full overflow-x-auto"><table className={`w-full text-left text-sm ${className}`} {...props} /></div>; }
export function TableHead(props: HTMLAttributes<HTMLTableSectionElement>) { return <thead {...props} className={`text-xs uppercase tracking-wide text-ink-muted ${props.className ?? ""}`} />; }
export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) { return <tbody {...props} className={`divide-y divide-border ${props.className ?? ""}`} />; }
export function TableRow(props: HTMLAttributes<HTMLTableRowElement>) { return <tr {...props} className={`transition-colors hover:bg-surface ${props.className ?? ""}`} />; }
