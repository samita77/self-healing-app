"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton() {
    const {pending } = useFormStatus();

    return (
        <button 
        type="submit"
        disabled={pending}
        className="rounded-lg border border-slate-600 px-2 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50">
            {pending ? "Pipeline running ..." : "Run pipeline"}
        </button>
    )
}