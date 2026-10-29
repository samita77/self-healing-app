import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">Create account</h1>
          <p className="text-sm text-slate-400">Self-Healing DevOps Platform</p>
        </div>

        <div className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
          <RegisterForm />
        </div>

        <p className="text-center text-xs text-slate-400">
          New accounts are created as <span className="font-mono">user</span>.
        </p>
      </div>
    </main>
  );
}
