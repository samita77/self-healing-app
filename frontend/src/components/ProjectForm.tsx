import { useState } from "react";
import type { FormEvent } from "react";
import { useCreateProject } from "@/hooks/useProjects";
import { fallbackMessage, httpStatus } from "@/lib/errors";

const FIELD =
  "w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-sm focus:border-green-500 focus:outline-none";

const INITIAL = {
  name: "",
  repo_url: "",
  container_port: "5000",
  health_path: "/",
};

export default function ProjectForm() {
  const createProject = useCreateProject();

  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState("");

  function update(field: keyof typeof INITIAL, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      repo_url: form.repo_url.trim(),
      // Image tag is derived from project name by DockerService.build_tag.
      container_port: Number(form.container_port || 5000),
      health_path: form.health_path.trim() || "/",
    };

    const missing = Object.entries(payload)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      setError(`Missing: ${missing.join(", ")}`);
      return;
    }

    setError("");
    try {
      await createProject.mutateAsync(payload);
      setForm(INITIAL);
    } catch (err) {
      const status = httpStatus(err);
      if (status === 401) setError("Your session expired. Please log in again.");
      else if (status) setError(`Registration failed (HTTP ${status})`);
      else setError(fallbackMessage(err));
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-slate-600 bg-[#1B2336] p-6 space-y-3"
    >
      <h2 className="text-sm font-semibold">Register a project</h2>

      <div className="space-y-1">
        <label htmlFor="name" className="block text-xs text-slate-400">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className={FIELD}
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
          value={form.repo_url}
          onChange={(e) => update("repo_url", e.target.value)}
          className={`${FIELD} font-mono text-xs`}
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
            className={`${FIELD} font-mono text-xs`}
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={createProject.isPending}
        className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {createProject.isPending ? "Registering..." : "Register project"}
      </button>
    </form>
  );
}
