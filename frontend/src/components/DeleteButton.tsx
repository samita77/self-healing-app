import { useState } from "react";
import { useNavigate } from "react-router";
import { useDeleteProject } from "@/hooks/useProjects";
import { fallbackMessage, httpStatus } from "@/lib/errors";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";

export default function DeleteButton({ projectId }: { projectId: number }) {
  const navigate = useNavigate();
  const deleteProject = useDeleteProject();
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function onDelete() {
    setError("");
    try {
      await deleteProject.mutateAsync(projectId);
      setConfirmOpen(false);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const status = httpStatus(err);
      if (status === 401) setError("Your session expired. Please log in again.");
      else if (status) setError(`Delete failed (HTTP ${status})`);
      else setError(fallbackMessage(err));
    }
  }

  return (
    <div>
      <Button type="button" variant="danger-ghost" size="sm" onClick={() => setConfirmOpen(true)}>Delete project</Button>
      {error && <p className="text-xs text-failed">{error}</p>}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete this project?">
        <p className="text-sm text-ink-muted">This will remove the project and its associated deployment history. This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button><Button variant="danger" loading={deleteProject.isPending} onClick={onDelete}>Delete project</Button></div>
      </Dialog>
    </div>
  );
}
