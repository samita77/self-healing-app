import { NextRequest, NextResponse } from "next/server";

/**
 * Redirects unauthenticated visitors to the login page.
 *
 * Done here rather than in the layout because the layout also wraps
 * /login - checking there would redirect back to itself in a loop.
 *
 * The token cookie is httpOnly, but middleware reads the raw Cookie
 * header, so it is visible here.
 */
const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  if (token) return NextResponse.next();

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except the API proxy and Next.js internals.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
