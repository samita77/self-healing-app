import { Link } from "react-router";
import ProjectForm from "@/components/ProjectForm";
import { useProjects } from "@/hooks/useProjects";

function ProjectSkeleton() {
  return (
    <ul className="space-y-2" aria-busy="true" aria-label="Loading projects">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="h-[66px] rounded-lg bg-[#1B2336] border border-slate-700 animate-pulse"
        />
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const { data: projects, isLoading, isError } = useProjects();

  return (
    <main className="p-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link
          to="/deployments"
          className="text-xs text-slate-400 underline underline-offset-2"
        >
          View all deployments
        </Link>
      </div>

      <ProjectForm />

      {isLoading ? (
        <ProjectSkeleton />
      ) : isError ? (
        <p className="text-sm text-red-500">Could not load projects.</p>
      ) : !projects || projects.length === 0 ? (
        <p className="text-sm text-slate-400">
          No projects yet. Register one to run your first pipeline.
        </p>
      ) : (
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                to={`/projects/${p.id}`}
                className="block rounded-lg border border-slate-600 bg-[#1B2336] p-4 flex justify-between items-center hover:border-slate-400"
              >
                <span className="text-sm">{p.name}</span>
                <span className="font-mono text-xs text-slate-400">
                  {p.repo_url}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
