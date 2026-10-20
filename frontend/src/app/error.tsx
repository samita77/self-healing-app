"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
            <h2 className="text-2xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-slate-400">
                {error.digest
                ? `Reference: ${error.digest}`
            :"An expected error occurred."}
            </p>
            <div className="flex gap-3">
                <button onClick={reset} className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:border-slate-400">Try again</button>
                <Link href="/" className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:border-slate-400">Back to projects</Link>
            </div>
        </main>
    );
}