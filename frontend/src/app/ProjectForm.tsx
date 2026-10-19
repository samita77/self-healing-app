"use client";

import { useActionState } from "react";
import { createProject, ProjectFormState } from "./actions";

const initial: ProjectFormState = { ok: false, error: "" };

export default function ProjectForm() {
  const [state, action, pending] = useActionState(createProject, initial);

  return (
    <form action={action} className="rounded-lg border border-slate-600 bg-[#1B2336] p-6 space-y-3">
      <h2 className="text-sm font-semibold">Register a project</h2>

      <div className="space-y-1">
        <label htmlFor="name" className="block text-xs text-slate-400">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="repo_url" className="block text-xs text-slate-400">
          Git repository URL
        </label>
        <input
          id="repo_url"
          name="repo_url"
          type="url"
          required
          placeholder="https://github.com/you/your-app"
          className="w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 font-mono text-xs focus:border-green-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="docker_image_name" className="block text-xs text-slate-400">
          Image name
        </label>
        <input
          id="docker_image_name"
          name="docker_image_name"
          required
          placeholder="your-app"
          className="w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 font-mono text-xs focus:border-green-500 focus:outline-none"
        />
      </div>

      {state.error && (
        <p className="text-xs text-red-500">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Registering..." : "Register project"}
      </button>
    </form>
  );
}