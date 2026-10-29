import { useEffect, useRef, useState } from "react";
import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";
import { tokenStore } from "@/lib/session";

export default function PipelineRunDialog({ open, runId, error, onClose }: { open: boolean; runId: number | null; error?: string; onClose: () => void }) {
  const [output, setOutput] = useState(""); const [status, setStatus] = useState("running");
  const [following, setFollowing] = useState(true);
  const logView = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (following && logView.current) logView.current.scrollTop = logView.current.scrollHeight;
  }, [output, following]);
  useEffect(() => {
    if (!runId) return;
    setOutput(""); setStatus("running"); setFollowing(true);
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}/pipelines/runs/${runId}/events`, { headers: { Authorization: `Bearer ${tokenStore.get()}` }, signal: controller.signal });
        if (!response.ok || !response.body) {
          const detail = await response.text().catch(() => "");
          throw new Error(detail || `Log stream request failed (HTTP ${response.status})`);
        }
        const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
        while (true) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const events = buffer.split("\n\n"); buffer = events.pop() ?? ""; for (const event of events) { const line = event.split("\n").find((row) => row.startsWith("data: ")); if (!line) continue; const data = JSON.parse(line.slice(6)) as { chunk: string; status: string; terminal: boolean }; setOutput((current) => current + data.chunk); setStatus(data.status); } }
      } catch (error) { if (!controller.signal.aborted) { setOutput((current) => current + `\n${String(error)}\n`); setStatus("failed"); } }
    })();
    return () => controller.abort();
  }, [runId]);
  return <Dialog open={open} onClose={onClose} title="Pipeline output" compactTitle className="!flex !h-[92vh] !max-w-[96vw] !flex-col !p-2 sm:!max-w-[92vw] sm:!p-3 xl:!max-w-[1440px]">
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-1 pb-2">
      <span className="rounded-md bg-surface px-2 py-1 font-mono text-xs capitalize text-ink-muted">{runId ? status : "Starting pipeline…"}</span>
      <div className="flex items-center gap-2">{!following && <Button variant="ghost" size="sm" onClick={() => { setFollowing(true); if (logView.current) logView.current.scrollTop = logView.current.scrollHeight; }}>Jump to latest</Button>}<Button variant="ghost" size="sm" onClick={onClose}>Close</Button></div>
    </div>
    {error && <p role="alert" className="shrink-0 px-1 py-2 text-sm text-failed">{error}</p>}
    <pre ref={logView} onScroll={(event) => { const element = event.currentTarget; const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 32; setFollowing(atBottom); }} aria-label="Pipeline log output" aria-live="off" className="mt-2 min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-neutral-subtle px-2 py-1.5 font-mono text-xs leading-[1.45] text-ink whitespace-pre-wrap break-words">{output ? <AnsiLog text={output} /> : (runId ? "Connecting to pipeline…" : "Creating a run and connecting to its output…")}</pre>
  </Dialog>;
}


const ansiColors: Record<number, string> = { 30: "var(--color-ink)", 31: "var(--color-failed)", 32: "var(--color-healthy)", 33: "var(--color-warning)", 34: "var(--color-primary)", 35: "#c084fc", 36: "#22d3ee", 37: "var(--color-ink-muted)", 90: "var(--color-ink-muted)", 91: "var(--color-failed)", 92: "var(--color-healthy)", 93: "var(--color-warning)", 94: "var(--color-primary)", 95: "#c084fc", 96: "#22d3ee", 97: "var(--color-ink)", 40: "var(--color-ink)", 41: "var(--color-failed)", 42: "var(--color-healthy)", 43: "var(--color-warning)", 44: "var(--color-primary)", 45: "#c084fc", 46: "#22d3ee", 47: "var(--color-ink-muted)", 100: "var(--color-ink-muted)", 101: "var(--color-failed)", 102: "var(--color-healthy)", 103: "var(--color-warning)", 104: "var(--color-primary)", 105: "#c084fc", 106: "#22d3ee", 107: "var(--color-ink)" };
function AnsiLog({ text }: { text: string }) {
  const parts = text.split(/\x1b\[([0-9;]*)m/); let color: string | undefined; let backgroundColor: string | undefined; let bold = false;
  const nodes = [];
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    if (index % 2 === 1) {
      for (const raw of part.split(";")) {
        const code = Number(raw || 0);
        if (code === 0) { color = undefined; backgroundColor = undefined; bold = false; }
        else if (code === 39) color = undefined;
        else if (code === 49) backgroundColor = undefined;
        else if (code === 1) bold = true;
        else if (code >= 40 && code <= 47 || code >= 100 && code <= 107) backgroundColor = ansiColors[code];
        else if (ansiColors[code]) color = ansiColors[code];
      }
    } else nodes.push(<span key={index} style={{ color, backgroundColor, fontWeight: bold ? 600 : undefined }}>{part}</span>);
  }
  return <>{nodes}</>;
}
