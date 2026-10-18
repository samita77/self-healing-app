import HealthGauge from "@/components/HealthGauge";
import { getProjects } from "@/lib/api";
import type { Project, Status } from "@/lib/types";
import Link from "next/link";
import { Suspense } from "react";

function ProjectSkeleton() {
  return (
    <ul className="space-y-2" aria-busy="true" aria-label="Loading projects">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="h-[66px] rounded-lg bg-[#1B2336] border border-slate-700 animate-pulse" />
      ))}
    </ul>
  );
}

async function ProjectList() {
  const projects = await getProjects();

  if (projects.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No projects yet. Register one to run your first pipeline.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {projects.map((p: Project) => (
        <li key={p.id}>
          <Link
            href={`/projects/${p.id}`}
            className="block rounded-lg border border-slate-600 bg-[#1B2336] p-4 flex justify-between items-center hover:border-slate-400">
              <span className="text-sm">{p.name}</span>
              <span className="font-mono text-xs text-slate-400">{p.repo_url}</span>
            </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main className="p-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link
        href="/deployments" className="text-xs text-slate-400 underline underline-offset-2">
          View all deployments
        </Link>
      </div>
        <Suspense fallback={<ProjectSkeleton />}>
          <ProjectList />
        </Suspense>
    </main>
  );
}