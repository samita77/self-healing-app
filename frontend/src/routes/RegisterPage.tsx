import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">Create account</h1>
          <p className="text-sm text-ink-muted">Self-Healing DevOps Platform</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <RegisterForm />
        </div>

        <p className="text-center text-xs text-ink-muted">
          New accounts are created as <span className="font-mono">user</span>.
        </p>
      </div>
    </main>
  );
}
