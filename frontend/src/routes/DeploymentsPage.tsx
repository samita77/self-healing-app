import { Link } from "react-router";
import { useDeployments } from "@/hooks/useDeployments";

function TableSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading deployments">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-12 rounded-lg bg-[#1B2336] border border-slate-700 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function DeploymentsPage() {
  const { data: deployments, isLoading, isError } = useDeployments();

  return (
    <main className="p-10 space-y-6">
      <h1 className="text-2xl font-semibold">Deployments</h1>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <p className="text-sm text-red-500">Could not load deployments.</p>
      ) : !deployments || deployments.length === 0 ? (
        <p className="text-sm text-slate-400">
          No deployments yet. Run a pipeline from a project to create the first
          one.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th scope="col" className="py-2">Version</th>
              <th scope="col" className="py-2">Project</th>
              <th scope="col" className="py-2">Status</th>
              <th scope="col" className="py-2 text-right">Health</th>
              <th scope="col" className="py-2 text-right">Deployed</th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((d) => (
              <tr key={d.id} className="border-t border-[#272F42] hover:bg-[#1B2336]">
                <td className="py-3">
                  <Link
                    to={`/deployments/${d.id}`}
                    className="font-mono text-xs text-slate-200 underline underline-offset-2"
                  >
                    {d.version}
                  </Link>
                </td>
                <td className="py-3 font-mono text-xs text-slate-400">
                  #{d.project_id}
                </td>
                <td className="py-3 font-mono text-xs uppercase">{d.status}</td>
                <td className="py-3 text-right font-mono tabular-nums">
                  {d.health_score ?? "—"}
                </td>
                <td className="py-3 text-right font-mono text-xs text-slate-400">
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
