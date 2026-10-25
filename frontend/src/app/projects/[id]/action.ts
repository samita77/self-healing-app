"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function runPipeline(projectId:number) {
    const store = await cookies();
    const token = store.get("token")?.value;

    const res = await fetch(`${BACKEND}/pipelines/run/${projectId}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    // A silent failure here is indistinguishable from success: the page just doesn't change. Surface it so 401 cannot masquerade as a slow run.
    if (!res.ok) {
        throw new Error(`Pipeline trigger failed (HTTP ${res.status})`);
    }

    revalidatePath(`/projects/${projectId}`);
}