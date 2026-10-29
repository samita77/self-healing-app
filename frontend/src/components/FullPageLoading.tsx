import Spinner from "@/components/ui/Spinner";
export default function FullPageLoading({ label = "Loading…" }: { label?: string }) { return <main className="flex min-h-[50vh] items-center justify-center p-8"><Spinner label={label} /></main>; }
