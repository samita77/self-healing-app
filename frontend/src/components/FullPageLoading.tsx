export default function FullPageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <main className="flex flex-1 items-center justify-center p-10">
      <p className="text-sm text-slate-400">{label}</p>
    </main>
  );
}
