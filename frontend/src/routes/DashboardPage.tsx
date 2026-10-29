import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, CheckCircle, MagnifyingGlass, RocketLaunch } from "@phosphor-icons/react";
import ProjectForm from "@/components/ProjectForm";
import { useProjects } from "@/hooks/useProjects";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Button, { buttonClass } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";

export default function DashboardPage() {
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => (projects ?? []).filter((project) => `${project.name} ${project.repo_url}`.toLowerCase().includes(search.trim().toLowerCase())), [projects, search]);

  return <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Projects</h1><p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">A focused view of the services connected to your delivery platform.</p></div>
      <div className="flex items-center gap-2"><Link to="/deployments" className={buttonClass("secondary", "md")}><RocketLaunch size={17} aria-hidden="true"/>Deployments</Link><ProjectForm/></div>
    </header>

    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section aria-labelledby="projects-heading" className="min-w-0">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 id="projects-heading" className="text-lg font-semibold tracking-tight">Your projects <span className="ml-1.5 align-middle text-sm font-normal text-ink-muted">{isLoading ? "" : projects?.length ?? 0}</span></h2><p className="mt-1 text-sm text-ink-muted">Select a project to inspect its releases and health.</p></div><label className="relative block w-full sm:max-w-xs"><MagnifyingGlass size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"/><Input type="search" value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Find a project…" aria-label="Search projects" className="pl-9"/></label></div>
        {isLoading ? <div className="space-y-2" aria-busy="true" aria-label="Loading projects">{[0,1,2].map((i)=><Skeleton key={i} className="h-[76px]"/>)}</div> : isError ? <Card><CardBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"><p role="alert" className="text-sm text-failed">Could not load projects.</p><Button variant="secondary" onClick={()=>void refetch()}>Try again</Button></CardBody></Card> : !projects?.length ? <EmptyState title="Your workspace is ready" description="Register a Git repository to create your first project and start a deployment pipeline." action={<ProjectForm/>}/> : !filtered.length ? <EmptyState title="No matching projects" description="Try a different project name or repository URL." action={<Button variant="ghost" onClick={()=>setSearch("")}>Clear search</Button>}/> : <div className="overflow-hidden rounded-xl border border-border bg-card"><ul className="divide-y divide-border">{filtered.map((project)=><li key={project.id}><Link to={`/projects/${project.id}`} className="group flex min-h-[76px] items-center gap-4 px-4 py-3 transition-colors hover:bg-surface sm:px-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-subtle text-sm font-semibold text-primary dark:bg-primary-subtle dark:text-primary">{project.name.trim().slice(0,1).toUpperCase()||"P"}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-semibold text-ink group-hover:text-primary">{project.name}</span><span className="text-[11px] text-ink-muted">Project {project.id}</span></span><span className="mt-1 block truncate font-mono text-xs text-ink-muted">{project.repo_url}</span></span><span className="hidden items-center gap-1.5 text-xs text-healthy sm:flex"><CheckCircle size={15} aria-hidden="true"/>Registered</span><ArrowRight size={17} aria-hidden="true" className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"/></Link></li>)}</ul></div>}
      </section>

      <aside className="space-y-4"><Card><CardHeader><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-subtle text-primary dark:bg-primary-subtle"><RocketLaunch size={17} aria-hidden="true"/></span><h2 className="text-sm font-semibold">Getting started</h2></div></CardHeader><CardBody className="space-y-4"><Step number="01" title="Add a repository" detail="Connect a Git repository as a project."/><Step number="02" title="Run the pipeline" detail="Build, test, and deploy from the project page."/><Step number="03" title="Review health" detail="Inspect health checks and deployment history."/><Link to="/metrics" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Open metrics<ArrowRight size={15} aria-hidden="true"/></Link></CardBody></Card><p className="px-1 text-xs leading-5 text-ink-muted">Projects are scoped to your account. Pipeline and health details are available inside each project.</p></aside>
    </div>
  </main>;
}
function Step({number,title,detail}:{number:string;title:string;detail:string}){return <div className="flex gap-3"><span className="pt-0.5 font-mono text-xs font-semibold text-primary">{number}</span><div><p className="text-sm font-medium">{title}</p><p className="mt-0.5 text-xs leading-5 text-ink-muted">{detail}</p></div></div>}
