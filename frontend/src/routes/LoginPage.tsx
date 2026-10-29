import { Link } from "react-router";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate-400">Self-Healing DevOps Platform</p>
        </div>

        <div className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-slate-400">
          Demo: <span className="font-mono">admin@self-healing.dev</span> /{" "}
          <span className="font-mono">admin123</span>
        </p>

        <p className="text-center text-xs text-slate-400">
          No account?{" "}
          <Link to="/register" className="underline underline-offset-2">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
