import { getDeployments, getProject } from "@/lib/api";
import { Deployment } from "@/lib/types";
import { notFound } from "next/navigation";
import { runPipeline } from "./action";
import DeleteButton from "./DeleteButton";
import PipelineRunsPoller from "./PipelineRunsPoller";
import SubmitButton from "./SubmitButton";
import Link from "next/link";
import { Suspense } from "react";

// Dynamic route reading request-time data (params, cookies) - under
// cacheComponents this declares the navigation is not expected to be instant.
export const instant = false;

async function ProjectBody({
    projectId,
}: {
    projectId: number;
}) {
    const [project, deployments] = await Promise.all([
        getProject(projectId).catch(() => null),
        getDeployments(projectId).catch(() => [] as Deployment[]),
    ]);

    if (!project) notFound();

    return (
        <div className="space-y-8">
            <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6 space-y-2">
                <h2 className="text-sm font-semibold">Repository</h2>
                <p className="font-mono text-xs text-slate-300 break-all">{project.repo_url}</p>
                {project.docker_image_name && (
                  <p className="font-mono text-xs text-slate-400">{project.docker_image_name}</p>
                )}

                <form action={runPipeline.bind(null, project.id)} className="pt-2">
                    <SubmitButton />
                </form>

                <div className="flex items-center gap-3 pt-2">
                    <Link
                        href={`/projects/${project.id}/edit`}
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
                {deployments.length === 0 ? (
                    <p className="text-sm text-slate-400">
                        No deployments yet. Run the pipeline to create the first one.
                    </p>
                ) : (
                    deployments.map((d) => (
                        <Link
                            key={d.id}
                            href={`/deployments/${d.id}`}
                            className="block rounded-lg border border-slate-600 bg-[#1B2336] p-4 text-sm hover:border-slate-400">
                            <span className="font-mono">{d.version}</span>
                            <span className="ml-3 font-mono text-xs uppercase text-slate-400">{d.status}</span>
                        </Link>
                    ))
                )}
            </section>
        </div>
    );
}

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <main className="p-10 space-y-6">
            <h1 className="text-2xl font-semibold">Project #{id}</h1>
            <Suspense fallback={<p className="text-sm text-slate-400">Loading...</p>}>
                <ProjectBody projectId={Number(id)} />
            </Suspense>
        </main>
    )
}
