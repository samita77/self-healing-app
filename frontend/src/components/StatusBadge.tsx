import type { Status } from "@/lib/types";

const VARIANT: Record<Status, string> = {
    SUCCESSFUL: "status-badge--healthy",
    WARNING: "status-badge--warning",
    FAILED: "status-badge--failed",
};

export default function StatusBadge({ status }: { status: Status }) {
    return (
        <span className={`status-badge ${VARIANT[status]}`}>
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
            {status}
        </span>
    );
}
