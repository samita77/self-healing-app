import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import Link from "next/link";

// The page reads the session cookie, which is runtime data. Under
// cacheComponents, `instant = false` declares that navigations here are not
// expected to be instant, so Next.js stops flagging the prerender.
export const instant = false;

export default async function LoginPage() {
  const store = await cookies();
  // Already signed in - no reason to show the form again.
  if (store.get("token")?.value) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center p-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate-400">
            Self-Healing DevOps Platform
          </p>
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
          <Link href="/register" className="underline underline-offset-2">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
