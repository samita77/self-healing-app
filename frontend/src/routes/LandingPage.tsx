import { Link } from "react-router";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col bg-[#0F172A] text-[#F8FAFC]">
      <nav className="border-b border-[#475569] px-10 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 font-semibold text-xl">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full bg-[#22C55E]"
          />
          <span>Self-Healing DevOps</span>
        </Link>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg border border-slate-600 text-sm"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-lg border border-[#22C55E] text-[#22C55E] text-sm"
          >
            Sign up
          </Link>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center px-10 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Self-Healing DevOps Platform</h1>
        <p className="text-lg text-slate-400 max-w-2xl mb-8">
          Automated deployment, health scoring, and rollback for containerised
          applications. Clone a repo, build and push an image, deploy to
          Kubernetes, score health — and auto-rollback if it degrades.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="rounded-lg border border-slate-700 bg-[#1B2336] p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Auto-deploy
            </h3>
            <p className="text-sm text-slate-300">
              Clones your repo, builds a container image, runs tests, and pushes
              to the local registry.
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-[#1B2336] p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Health scoring
            </h3>
            <p className="text-sm text-slate-300">
              Weighted multi-component score with p95 response time and
              exponential decay.
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-[#1B2336] p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Auto-rollback
            </h3>
            <p className="text-sm text-slate-300">
              Two-consecutive-failure guard prevents harmful automation. Rolls
              back to known-good versions.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/login"
            className="inline-block px-6 py-3 rounded-lg border border-[#22C55E] bg-[#22C55E] text-[#0F172A] font-semibold text-sm"
          >
            Get started
          </Link>
          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="underline">
              Log in
            </Link>
          </p>
        </div>
      </section>

      <footer className="border-t border-[#475569] py-4 text-xs text-slate-500 text-center">
        CACS452 Project III · Self-Healing DevOps Platform
      </footer>
    </main>
  );
}
