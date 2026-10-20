import { getDeployments } from "@/lib/api";
import { Deployment } from "@/lib/types";
import Link from "next/link";
import { Suspense } from "react";

// Fetches uncached data, so navigation is declared non-instant.
export const instant = false;

function TableSkeleton(){
    return (
        <div className="space-y-2" aria-busy="true" aria-label="Loading deployments">
            {[0, 1, 2].map((i) =>(
                <div key={i} className="h-12 rounded-lg bg-[#1B2336] border border-slate-700 animate-pulse" />
            ))}
        </div>
    );
}

async function DeploymentList() {
    const deployments: Deployment[] = await getDeployments();

    if (deployments.length === 0) {
        return (
            <p className="text-sm text-slate-400">
                No deployments yet. Run a pipeline from a project to create the first one.
            </p>
        );
    }

    return (
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
                            href={`/deployments/${d.id}`}
                            className="font-mono text-xs text-slate-200 underline underline-offset-2">
                                {d.version}
                            </Link>
                        </td>
                        <td className="py-3 font-mono text-xs text-slate-400">#{d.project_id}</td>
                        <td className="py-3 font-mono text-xs uppercase">{d.status}</td>
                        <td className="py-3 text-right font-mono tabular-nums">{d.health_score ?? "—"}</td>
                        <td className="py-3 text-right font-mono text-xs text-slate-400">{new Date(d.deployed_at).toISOString().slice(0, 16).replace("T", " ")}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function DeploymentsPage() {
    return (
        <main className="p-10 space-y-6">
            <h1 className="text-2xl font-semibold">Deployments</h1>
            <Suspense fallback={<TableSkeleton />}>
                <DeploymentList />
            </Suspense>
        </main>
    );
}