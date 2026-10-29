import { Link } from "react-router";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-ink-muted">Self-Healing DevOps Platform</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-ink-muted">
          Demo: <span className="font-mono">admin@self-healing.dev</span> /{" "}
          <span className="font-mono">admin123</span>
        </p>

        <p className="text-center text-xs text-ink-muted">
          No account?{" "}
          <Link to="/register" className="underline underline-offset-2">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
