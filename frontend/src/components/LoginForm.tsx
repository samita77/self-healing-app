import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { useLogin } from "@/hooks/useAuth";
import { fallbackMessage, httpStatus } from "@/lib/errors";

import { inputClass } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const FIELD = inputClass;

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
        <label htmlFor="email" className="block text-xs text-ink-muted">
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
        <label htmlFor="password" className="block text-xs text-ink-muted">
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

      {error && <p className="text-xs text-failed">{error}</p>}

      <Button
        type="submit"
        loading={login.isPending}
        className="w-full"
      >
        {login.isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
