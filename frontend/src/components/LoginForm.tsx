import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { useLogin } from "@/hooks/useAuth";
import { fallbackMessage, httpStatus } from "@/lib/errors";

const FIELD =
  "w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-sm focus:border-green-500 focus:outline-none";

export default function LoginForm() {
  const navigate = useNavigate();
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Enter both email and password.");
      return;
    }

    setError("");
    try {
      await login.mutateAsync({ email: email.trim(), password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const status = httpStatus(err);
      if (status === 401) setError("Incorrect email or password.");
      else if (status) setError(`Login failed (HTTP ${status})`);
      else setError(fallbackMessage(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={FIELD}
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={FIELD}
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={login.isPending}
        className="w-full rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {login.isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
