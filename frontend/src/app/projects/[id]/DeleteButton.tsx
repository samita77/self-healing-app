"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteProject, type FormState } from "@/app/actions";

export default function DeleteButton({
  projectId,
}: {
  projectId: number;
}) {
  const router = useRouter();
  const [state, action] = useActionState(
    (prev: FormState, fd: FormData) => deleteProject(prev, fd),
    { ok: false, error: "" }
  );

  useEffect(() => {
    if (state.ok) router.push("/dashboard");
  }, [state.ok, projectId, router]);

  if (state.error) {
    return (
      <button
        onClick={() => action(new FormData())}
        className="text-red-500 hover:text-red-400 hover:underline text-sm"
      >
        Delete failed — click to retry
      </button>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="project_id" value={String(projectId)} />
      <button
        type="submit"
        className="text-red-500 hover:text-red-400 hover:underline text-sm"
      >
        Delete project
      </button>
    </form>
  );
}
