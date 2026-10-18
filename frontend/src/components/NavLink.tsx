"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function NavLink({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    const pathname = usePathname();
    const active = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link 
        href={href}
        aria-current={active ? "page" : undefined}
        className={`text-sm transition-colors ${
            active
            ? "text-slate-50"
            : "text-slate-400 hover:text-slate-200" 
        }`}
        >
            {children}
        </Link>
    );
}