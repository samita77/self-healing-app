"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { updateProject, type FormState } from "@/app/actions";

const initial: FormState = { ok: false, error: "" };

const FIELD =
  "w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-sm focus:border-green-500 focus:outline-none";

export default function EditProjectPage() {
  const router = useRouter();
  const { id } = useParams();
  const projectId = Number(id);
  const [state, action, pending] = useActionState(
    (prev: FormState, fd: FormData) => updateProject(projectId, prev, fd),
    initial
  );
  const [form, setForm] = useState({
    repo_url: "",
    container_port: "5000",
    health_path: "/",
    replicas: "2",
  });

  useEffect(() => {
    // Prefill form from the project page data passed via URL search params
    const params = new URLSearchParams(window.location.search);
    if (params.get("repo_url")) setForm((f) => ({ ...f, repo_url: params.get("repo_url")! }));
    if (params.get("container_port")) setForm((f) => ({ ...f, container_port: params.get("container_port")! }));
    if (params.get("health_path")) setForm((f) => ({ ...f, health_path: params.get("health_path")! }));
    if (params.get("replicas")) setForm((f) => ({ ...f, replicas: params.get("replicas")! }));
  }, []);

  useEffect(() => {
    if (state.ok) router.push(`/projects/${projectId}`);
  }, [state.ok, projectId, router]);

  return (
    <main className="p-10 space-y-6">
      <nav className="flex items-center gap-2">
        <Link
          href={`/projects/${projectId}`}
          className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-200"
        >
          ← Back to project
        </Link>
      </nav>

      <h1 className="text-2xl font-semibold">Edit Project</h1>

      <form action={action} className="rounded-lg border border-slate-600 bg-[#0F172A] p-6 space-y-3">
        <div className="space-y-1">
          <label htmlFor="repo_url" className="block text-xs text-slate-400">
            Git repository URL
          </label>
          <input
            id="repo_url"
            name="repo_url"
            type="url"
            defaultValue={form.repo_url}
            required
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
              defaultValue={form.container_port}
              required
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
              defaultValue={form.health_path}
              required
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
              defaultValue={form.replicas}
              required
              className={FIELD}
            />
          </div>
        </div>

        {state.error && <p className="text-xs text-red-500">{state.error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {pending ? "Updating..." : "Update project"}
          </button>
        </div>
      </form>
    </main>
  );
}
