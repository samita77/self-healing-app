"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, type FormState } from "../actions";

const INITIAL: FormState = { ok: false, error: "" };

const FIELD =
  "w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-sm focus:border-green-500 focus:outline-none";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(register, INITIAL);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.push("/dashboard");
  }, [state.ok, router]);

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="full_name" className="block text-xs text-slate-400">
          Full name
        </label>
        <input id="full_name" name="full_name" required autoComplete="name" className={FIELD} />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-xs text-slate-400">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={FIELD} />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-xs text-slate-400">
          Password
        </label>
        <input
          id="password" name="password" type="password" required minLength={8}
          autoComplete="new-password" className={FIELD}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirm" className="block text-xs text-slate-400">
          Confirm password
        </label>
        <input
          id="confirm" name="confirm" type="password" required minLength={8}
          autoComplete="new-password" className={FIELD}
        />
      </div>

      {state.error && <p className="text-xs text-red-500">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-xs text-slate-400">
        Already registered?{" "}
        <Link href="/login" className="underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </form>
  );
}