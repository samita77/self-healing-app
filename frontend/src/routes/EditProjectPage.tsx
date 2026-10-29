import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import FullPageLoading from "@/components/FullPageLoading";
import NotFoundContent from "@/components/NotFoundContent";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { fallbackMessage, httpStatus } from "@/lib/errors";
import type { Project } from "@/lib/types";

const FIELD =
  "w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-sm focus:border-green-500 focus:outline-none";

function EditProjectForm({
  project,
  projectId,
}: {
  project: Project;
  projectId: number;
}) {
  const navigate = useNavigate();
  const updateProject = useUpdateProject(projectId);

  const [form, setForm] = useState({
    repo_url: project.repo_url ?? "",
    container_port: String(project.container_port ?? 5000),
    health_path: project.health_path ?? "/",
    replicas: String(project.replicas ?? 2),
  });
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: {
      repo_url?: string;
      container_port: number;
      health_path: string;
      replicas: number;
    } = {
      container_port: Number(form.container_port || 5000),
      health_path: form.health_path.trim() || "/",
      replicas: Number(form.replicas || 2),
    };
    if (form.repo_url.trim()) payload.repo_url = form.repo_url.trim();

    setError("");
    try {
      await updateProject.mutateAsync(payload);
      navigate(`/projects/${projectId}`);
    } catch (err) {
      const status = httpStatus(err);
      if (status === 401) setError("Your session expired. Please log in again.");
      else if (status) setError(`Update failed (HTTP ${status})`);
      else setError(fallbackMessage(err));
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-slate-600 bg-[#0F172A] p-6 space-y-3"
    >
      <div className="space-y-1">
        <label htmlFor="repo_url" className="block text-xs text-slate-400">
          Git repository URL
        </label>
        <input
          id="repo_url"
          name="repo_url"
          type="url"
          required
          value={form.repo_url}
          onChange={(e) => update("repo_url", e.target.value)}
          className={FIELD}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="container_port" className="block text-xs text-slate-400">
            Container port
          </label>
          <input
            id="container_port"
            name="container_port"
            type="number"
            required
            value={form.container_port}
            onChange={(e) => update("container_port", e.target.value)}
            className={FIELD}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="health_path" className="block text-xs text-slate-400">
            Health path
          </label>
          <input
            id="health_path"
            name="health_path"
            required
            value={form.health_path}
            onChange={(e) => update("health_path", e.target.value)}
            className={FIELD}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="replicas" className="block text-xs text-slate-400">
            Replicas
          </label>
          <input
            id="replicas"
            name="replicas"
            type="number"
            required
            value={form.replicas}
            onChange={(e) => update("replicas", e.target.value)}
            className={FIELD}
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={updateProject.isPending}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {updateProject.isPending ? "Updating..." : "Update project"}
        </button>
      </div>
    </form>
  );
}

export default function EditProjectPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const isValidId = Number.isFinite(projectId);
  const projectQuery = useProject(projectId);

  if (!isValidId) return <NotFoundContent />;
  if (projectQuery.isLoading) return <FullPageLoading label="Loading project…" />;
  if (projectQuery.isError || !projectQuery.data) return <NotFoundContent />;

  return (
    <main className="p-10 space-y-6">
      <nav className="flex items-center gap-2">
        <Link
          to={`/projects/${projectId}`}
          className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-200"
        >
          ← Back to project
        </Link>
      </nav>

      <h1 className="text-2xl font-semibold">Edit Project</h1>

      <EditProjectForm project={projectQuery.data} projectId={projectId} />
    </main>
  );
}
