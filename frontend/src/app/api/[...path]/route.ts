import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

/**
 * Proxies API calls to the backend.
 *
 * The browser talks only to this origin, so the httpOnly session cookie is
 * sent automatically. This server-side handler then forwards the request to
 * the backend with the token in an Authorization header - the token never
 * reaches client-side JavaScript.
 *
 * It also removes the need for CORS on the backend.
 */

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  // Preserve a trailing slash - FastAPI redirects /projects to /projects/,
  // and forwarding without it costs an extra round trip on every call.
  const slash = request.nextUrl.pathname.endsWith("/") ? "/" : "";
  const url = `${BACKEND}/${path.join("/")}${slash}${request.nextUrl.search}`;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  const response = await fetch(url, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const text = await response.text();

  return new NextResponse(text || null, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, context);
}
