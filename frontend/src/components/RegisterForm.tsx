import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useRegister } from "@/hooks/useAuth";
import { fallbackMessage, httpStatus } from "@/lib/errors";

import { inputClass } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const FIELD = inputClass;

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
        <label htmlFor="full_name" className="block text-xs text-ink-muted">
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
        <label htmlFor="email" className="block text-xs text-ink-muted">
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
        <label htmlFor="password" className="block text-xs text-ink-muted">
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
        <label htmlFor="confirm" className="block text-xs text-ink-muted">
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

      {error && <p className="text-xs text-failed">{error}</p>}

      <Button
        type="submit"
        loading={register.isPending}
        className="w-full"
      >
        {register.isPending ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-xs text-ink-muted">
        Already registered?{" "}
        <Link to="/login" className="underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </form>
  );
}
