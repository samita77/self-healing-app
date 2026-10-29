import { Link } from "react-router";
import { useDeployments } from "@/hooks/useDeployments";

function TableSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading deployments">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-12 rounded-lg bg-card border border-border animate-pulse"
        />
      ))}
    </div>
  );
}

export default function DeploymentsPage() {
  const { data: deployments, isLoading, isError } = useDeployments();

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <h1 className="text-xl font-semibold tracking-tight">Deployments</h1>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <p className="text-sm text-failed">Could not load deployments.</p>
      ) : !deployments || deployments.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No deployments yet. Run a pipeline from a project to create the first
          one.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
              <th scope="col" className="py-2">Version</th>
              <th scope="col" className="py-2">Project</th>
              <th scope="col" className="py-2">Status</th>
              <th scope="col" className="py-2 text-right">Health</th>
              <th scope="col" className="py-2 text-right">Deployed</th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((d) => (
              <tr key={d.id} className="border-t border-border hover:bg-card">
                <td className="py-3">
                  <Link
                    to={`/deployments/${d.id}`}
                    className="font-mono text-xs text-ink underline underline-offset-2"
                  >
                    {d.version}
                  </Link>
                </td>
                <td className="py-3 font-mono text-xs text-ink-muted">
                  #{d.project_id}
                </td>
                <td className="py-3 font-mono text-xs uppercase">{d.status}</td>
                <td className="py-3 text-right font-mono tabular-nums">
                  {d.health_score ?? "—"}
                </td>
                <td className="py-3 text-right font-mono text-xs text-ink-muted">
                  {new Date(d.deployed_at).toISOString().slice(0, 16).replace("T", " ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
