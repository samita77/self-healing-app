"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, type FormState } from "../actions";

const INITIAL: FormState = { ok: false, error: "" };

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, INITIAL);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.push("/dashboard");
  }, [state.ok, router]);

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-xs text-slate-400">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-xs text-slate-400">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        />
      </div>

      {state.error && <p className="text-xs text-red-500">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
