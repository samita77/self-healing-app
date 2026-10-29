import Badge from "@/components/ui/Badge";
import type { Status } from "@/lib/types";
const variant = { SUCCESSFUL: "healthy", WARNING: "warning", FAILED: "failed" } as const;
export default function StatusBadge({ status }: { status: Status }) { return <Badge variant={variant[status]}>{status}</Badge>; }
