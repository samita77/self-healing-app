import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useRegister } from "@/hooks/useAuth";
import { fallbackMessage, httpStatus } from "@/lib/errors";

const FIELD =
  "w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-sm focus:border-green-500 focus:outline-none";

const EMPTY = {
  full_name: "",
  email: "",
  password: "",
  confirm: "",
};

export default function RegisterForm() {
  const navigate = useNavigate();
  const register = useRegister();

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  function update(field: keyof typeof EMPTY, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = form.email.trim();
    const fullName = form.full_name.trim();
    const password = form.password;
    const confirm = form.confirm;

    if (!email || !fullName || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    try {
      const result = await register.mutateAsync({
        email,
        full_name: fullName,
        password,
      });

      if (!result.session) {
        setError("Account created. Please sign in.");
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const status = httpStatus(err);
      if (status === 409) {
        setError("An account with this email already exists.");
      } else if (status) {
        setError(`Registration failed (HTTP ${status})`);
      } else {
        setError(fallbackMessage(err));
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="full_name" className="block text-xs text-slate-400">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          autoComplete="name"
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          className={FIELD}
        />
      </div>

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
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
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
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          className={FIELD}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirm" className="block text-xs text-slate-400">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => update("confirm", e.target.value)}
          className={FIELD}
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={register.isPending}
        className="w-full rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {register.isPending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-xs text-slate-400">
        Already registered?{" "}
        <Link to="/login" className="underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </form>
  );
}
