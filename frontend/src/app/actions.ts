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
  const name = String(formData.get("name") ?? "").trim();

  const payload = {
    name,
    repo_url: String(formData.get("repo_url") ?? "").trim(),
    // Image tag is derived from project name by DockerService.build_tag.
    container_port: Number(formData.get("container_port") ?? 5000),
    health_path: String(formData.get("health_path") ?? "/").trim() || "/",
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
async function setSession(token: string) {
  // httpOnly means client-side JavaScript cannot read the token, which
  // neutralises token theft via XSS. sameSite=lax blocks cross-site
  // request forgery while still allowing the cookie on normal navigation.
  const store = await cookies();
  store.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60,
    path: "/",
  });
}

export async function register(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!email || !full_name || !password) {
    return { ok: false, error: "All fields are required." };
  }
  // Server-side, because browser validation is a convenience, not a control.
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match." };
  }

  const res = await fetch(`${BACKEND}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, full_name, password }),
  });

  if (res.status === 409) {
    return { ok: false, error: "An account with this email already exists." };
  }
  if (!res.ok) {
    // 422 arrives when EmailStr rejects the address - do not use .local.
    return { ok: false, error: `Registration failed (HTTP ${res.status})` };
  }

  // Sign in immediately. Making the user retype the password they just
  // chose adds a failure point without adding any security.
  const loginRes = await fetch(`${BACKEND}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!loginRes.ok) {
    return { ok: false, error: "Account created. Please sign in." };
  }

  const { access_token } = await loginRes.json();
  await setSession(access_token);

  revalidatePath("/");
  return { ok: true, error: "" };
}

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
  await setSession(access_token);

  return { ok: true, error: "" };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete("token");
  revalidatePath("/");
}

// ---------- project update/delete ----------

export async function updateProject(
  projectId: number,
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const repo_url = String(formData.get("repo_url") ?? "").trim();
  const container_port = Number(formData.get("container_port") ?? 5000);
  const health_path = String(formData.get("health_path") ?? "/").trim() || "/";
  const replicas = Number(formData.get("replicas") ?? 2);

  const payload: Record<string, string | number> = {};
  if (repo_url) payload.repo_url = repo_url;
  payload.container_port = container_port;
  if (health_path) payload.health_path = health_path;
  payload.replicas = replicas;

  const res = await fetch(`${BACKEND}/projects/${projectId}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    return { ok: false, error: "Your session expired. Please log in again." };
  }
  if (!res.ok) {
    return { ok: false, error: `Update failed (HTTP ${res.status})` };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true, error: "" };
}

export async function deleteProject(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const projectId = Number(formData.get("project_id"));

  const res = await fetch(`${BACKEND}/projects/${projectId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });

  if (res.status === 401) {
    return { ok: false, error: "Your session expired. Please log in again." };
  }
  if (!res.ok) {
    return { ok: false, error: `Delete failed (HTTP ${res.status})` };
  }

  revalidatePath("/dashboard");
  return { ok: true, error: "" };
}
