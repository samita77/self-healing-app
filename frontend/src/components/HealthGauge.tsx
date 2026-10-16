type Props = {
    score: number;
    warning?: number;
    healthy?: number;
};

const CX = 70;
const CY = 70;
const R = 52;

function polarToCartesian(angleDeg: number) {
    const a = (angleDeg - 90) * (Math.PI /180);
    return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
}

function arc(startScore: number, endscore: number) {
    const a1 = 135 + (startScore / 100) * 270;
    const a2 = 135 + (endscore / 100) * 270;
    const s = polarToCartesian(a2);
    const e = polarToCartesian(a1);
    return `M ${s.x} ${s.y} A ${R} 0 ${a2 - a1 > 180 ? 1 : 0} 0 ${e.x} ${e.y}`;
}

export default function HealthGauge({
    score,
    warning = 50,
    healthy = 80,
}: Props){
    const clamped = Math.max(0, Math.min(100, score));
    const colour =
    clamped >= healthy
    ? "var(--status-healthy)"
    : clamped >= warning
    ? "var(--status-warning)"
    : "var(--status-failed)";

    const needleAngle = 135 + (clamped / 100) * 270;

    return (
       <div className="flex items-center gap-6">
        <svg width="140" height="100" viewBox="0 0 140 100" role="img" aria-label="{`Health score ${clamped} out of 100`}">
            <path d={arc(0, warning)} fill="none" stroke="var(--status-failed)" strokeWidth="12" strokeLinecap="butt" />
            <path d={arc(warning, healthy)} fill="none" stroke="var(--status-warning)" strokeWidth="12" strokeLinecap="butt" />
            <path d={arc(healthy, 100)} fill="none" stroke="var(--status-healthy)" strokeWidth="12" strokeLinecap="butt" />

            <line
                x1={CX} y1={CY}
                x2={polarToCartesian(needleAngle).x}
                y2={polarToCartesian(needleAngle).y}
                stroke="var(--text)" strokeWidth="3" strokeLinecap="round"
            />
            <circle cx={CX} cy={CY} r="5" fill="var(--text)" />
        </svg>

        <div>
            <p className="text-4xl font-semibold tabular-nums" style={{ color: colour }}>
                {clamped}
            </p>
            <p className="text-4xl text-slate-400 mt-1">
                out of 100 &middot; target {healthy}
            </p>
        </div>
       </div> 
    );
}