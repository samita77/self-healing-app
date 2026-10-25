"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function checkHealth(deploymentId: number, formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return;

  const store = await cookies();
  const token = store.get("token")?.value;

  const endpoint =
    `${BACKEND}/monitor/check-and-heal` +
    `?deployment_id=${deploymentId}` +
    `&url=${encodeURIComponent(url)}`;

  const res = await fetch(endpoint, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Health check failed (HTTP ${res.status})`);
  }

  revalidatePath(`/deployments/${deploymentId}`);
}