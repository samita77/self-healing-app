"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export type FormState = {
  ok: boolean;
  error: string;
};

const EMPTY: FormState = { ok: false, error: "" };

async function authHeaders(extra: Record<string, string> = {}) {
  const store = await cookies();
  const token = store.get("token")?.value;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ---------- project registration ----------

export async function createProject(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
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

  const res = await fetch(`${BACKEND}/projects/`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    return { ok: false, error: "Your session expired. Please log in again." };
  }
  if (!res.ok) {
    return { ok: false, error: `Registration failed (HTTP ${res.status})` };
  }

  revalidatePath("/");
  return { ok: true, error: "" };
}

// ---------- authentication ----------

export async function login(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Enter both email and password." };
  }

  const res = await fetch(`${BACKEND}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (res.status === 401) {
    // Same message whether the email or password is wrong.
    return { ok: false, error: "Incorrect email or password." };
  }
  if (!res.ok) {
    return { ok: false, error: `Login failed (HTTP ${res.status})` };
  }

  const { access_token } = await res.json();

  // httpOnly means client-side JavaScript cannot read the token, which
  // neutralises token theft via XSS. sameSite=lax blocks cross-site
  // request forgery while still allowing the cookie on normal navigation.
  const store = await cookies();
  store.set("token", access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60,
    path: "/",
  });

  return { ok: true, error: "" };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete("token");
  revalidatePath("/");
}
