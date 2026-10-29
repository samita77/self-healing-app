import { useState } from "react";
import { useNavigate } from "react-router";
import { useDeleteProject } from "@/hooks/useProjects";
import { fallbackMessage, httpStatus } from "@/lib/errors";

export default function DeleteButton({ projectId }: { projectId: number }) {
  const navigate = useNavigate();
  const deleteProject = useDeleteProject();
  const [error, setError] = useState("");

  async function onDelete() {
    setError("");
    try {
      await deleteProject.mutateAsync(projectId);
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
      <button
        type="button"
        onClick={onDelete}
        disabled={deleteProject.isPending}
        className="text-red-500 hover:text-red-400 hover:underline text-sm disabled:opacity-50"
      >
        {deleteProject.isPending ? "Deleting…" : "Delete project"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
