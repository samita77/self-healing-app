"use server";

import { revalidatePath } from "next/cache";

const BASE = "http://localhost:8000"

export async function runPipeline(projectId:number) {
    await fetch (`${BASE}/pipelines/run/${projectId}`, { method: "POST" });
    revalidatePath(`/projects/${projectId}`);
}