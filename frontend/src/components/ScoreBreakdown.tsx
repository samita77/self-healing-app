import type { ScoreComponents } from "@/lib/types";

const ROWS = [
    {
        key: "S_availability",
        label: "Availability",
        weight: 0.4,
        hint: "successful probes / total probes",
    },
    {
        key: "R_response_time",
        label: "Response time",
        weight: 0.3,
        hint: "exponential decay on p95 latency",
    },
    {
        key: "E_error_rate",
        label: "Error rate",
        weight: 0.2,
        hint: "1 - (failed / total)",
    },
    {
        key: "P_pod_readiness",
        label: "Pod readiness",
        weight: 0.1,
        hint: "ready replicas / desired",
    },
] as const;

export default function ScoreBreakdown({
    components,
}: {
    components: ScoreComponents;
}) {
    const total = ROWS.reduce(
        (sum, r) => sum + components[r.key] * r.weight, 0,
    );

    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th scope="col" className="py-2">Component</th>
                    <th scope="col" className="py-2 text-right">Raw</th>
                    <th scope="col" className="py-2 text-right">Weight</th>
                    <th scope="col" className="py-2 text-right">Contribution</th>
                </tr>
            </thead>

            <tbody>
                {ROWS.map((r) => {
                    const raw = components[r.key];
                    const contribution = raw * r.weight;

                    return (
                        <tr key={r.key} className="border-t border-[#272F42]">
                            <td className="py-2.5">
                                <span>{r.label}</span>
                                <span className="block text-xs text-slate-400">{r.hint}</span>
                            </td>
                            <td className="py-2.5 text-right font-mono tabular-nums">{raw.toFixed(1)}
                            </td>
                            <td className="py-2.5 text-right font-mono text-slate-400">{r.weight.toFixed(2)}
                            </td>
                            <td className="py-2.5 text-right font-mono tabular-nums">{contribution.toFixed(1)}
                            </td>
                        </tr>
                    );
                })}
            </tbody>

            <tfoot>
                <tr className="border-t-2 border-slate-600 font-semibold">
                    <td className="py-2.5">Total health score</td>
                    <td className="py-2.5" />
                    <td className="py-2.5" />
                    <td className="py-2.5 text-right font-mono tabular-nums" >{total.toFixed(1)}
                    </td>
                </tr>
            </tfoot>
        </table>
    );
}
