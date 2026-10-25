"use client";

import { useFormStatus } from "react-dom";

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Checking..." : "Check health"}
    </button>
  );
}

export default function HealthCheckForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="flex gap-2">
      <input
        name="url"
        required
        placeholder="http://192.168.49.2:30080/health"
        className="w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 font-mono text-xs focus:border-green-500 focus:outline-none"
      />
      <Submit />
    </form>
  );
}