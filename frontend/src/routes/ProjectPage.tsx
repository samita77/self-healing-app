import { Link, useParams } from "react-router";
import DeleteButton from "@/components/DeleteButton";
import NotFoundContent from "@/components/NotFoundContent";
import PipelineRunsPoller from "@/components/PipelineRunsPoller";
import { useDeployments } from "@/hooks/useDeployments";
import { useRunPipeline } from "@/hooks/usePipelines";
import { useProject } from "@/hooks/useProjects";
import { fallbackMessage, httpStatus } from "@/lib/errors";
import { useState } from "react";

export default function ProjectPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const isValidId = Number.isFinite(projectId);

  const projectQuery = useProject(projectId);
  const deploymentsQuery = useDeployments(projectId);
  const runPipeline = useRunPipeline(projectId);
  const [error, setError] = useState("");

  if (!isValidId) return <NotFoundContent />;
  if (projectQuery.isLoading) {
    return (
      <main className="p-10 space-y-6">
        <div className="h-9 w-64 rounded-lg bg-[#1B2336] border border-slate-700 animate-pulse" />
        <div className="h-40 rounded-lg bg-[#1B2336] border border-slate-700 animate-pulse" />
        <div className="h-40 rounded-lg bg-[#1B2336] border border-slate-700 animate-pulse" />
      </main>
    );
  }
  if (projectQuery.isError || !projectQuery.data) return <NotFoundContent />;

  const project = projectQuery.data;
  const deployments = deploymentsQuery.data ?? [];

  async function onRunPipeline() {
    setError("");
    try {
      await runPipeline.mutateAsync();
    } catch (err) {
      const status = httpStatus(err);
      if (status === 401) setError("Your session expired. Please log in again.");
      else if (status) setError(`Pipeline trigger failed (HTTP ${status})`);
      else setError(fallbackMessage(err));
    }
  }

  return (
    <main className="p-10 space-y-6">
      <h1 className="text-2xl font-semibold">Project #{project.id}</h1>

      <div className="space-y-8">
        <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6 space-y-2">
          <h2 className="text-sm font-semibold">Repository</h2>
          <p className="font-mono text-xs text-slate-300 break-all">
            {project.repo_url}
          </p>
          {project.docker_image_name && (
            <p className="font-mono text-xs text-slate-400">
              {project.docker_image_name}
            </p>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={onRunPipeline}
              disabled={runPipeline.isPending}
              className="rounded-lg border border-slate-600 px-2 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {runPipeline.isPending ? "Pipeline running ..." : "Run pipeline"}
            </button>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Link
              to={`/projects/${project.id}/edit`}
              className="px-4 py-2 rounded-lg border border-slate-600 text-sm hover:bg-slate-700"
            >
              Edit
            </Link>
            <DeleteButton projectId={project.id} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Pipeline runs</h2>
          <PipelineRunsPoller projectId={project.id} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Deployments</h2>
          {deploymentsQuery.isError ? (
            <p className="text-sm text-red-500">Could not load deployments.</p>
          ) : deployments.length === 0 ? (
            <p className="text-sm text-slate-400">
              No deployments yet. Run the pipeline to create the first one.
            </p>
          ) : (
            deployments.map((d) => (
              <Link
                key={d.id}
                to={`/deployments/${d.id}`}
                className="block rounded-lg border border-slate-600 bg-[#1B2336] p-4 text-sm hover:border-slate-400"
              >
                <span className="font-mono">{d.version}</span>
                <span className="ml-3 font-mono text-xs uppercase text-slate-400">
                  {d.status}
                </span>
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
