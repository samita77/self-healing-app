"use server";

import { revalidatePath } from "next/cache";

const BASE = "http://localhost:8000";

export type ProjectFormState = {
  ok: boolean;
  error: string;
};

export async function createProject(
  prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    repo_url: String(formData.get("repo_url") ?? "").trim(),
    docker_image_name: String(
      formData.get("docker_image_name") ?? "",
    ).trim(),
  };

  const missing = Object.entries(payload)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    return { ok: false, error: `Missing: ${missing.join(", ")}` };
  }

  const res = await fetch(`${BASE}/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { ok: false, error: `Registration failed (HTTP ${res.status})` };
  }

  revalidatePath("/");
  return { ok: true, error: "" };
}