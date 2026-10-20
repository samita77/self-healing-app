import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import Link from "next/link";
import NavLink from "@/components/NavLink";
import UserMenu from "@/components/UserMenu";
import { Suspense } from "react";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Self-Healing DevOps Platform",
  description: "Automated deployment, health scoring and rollback for containerised applications",
};

/**
 * Resolves the signed-in user for the header.
 * Returns null on any failure rather than throwing - an unreadable token
 * should show a signed-out header, not break the whole page.
 */
async function currentUser() {
  const store = await cookies();
  const token = store.get("token")?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${BACKEND}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as { email: string; role: string };
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await currentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0F172A] text-[#F8FAFC]">
        <header className="border-b border-[#475569]">
          <div className="mx-auto flex max-w-1400 items-center justify-between px-10 py-4">
            <Link href="/" className="flex items-center gap-2">
              <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
              <span className="text-sm font-semibold">
                Self-Healing DevOps
              </span>
            </Link>

            <div className="flex items-center gap-6">
              {/*
                NavLink reads usePathname(), which is request-time URL data.
                Under cacheComponents that must sit inside a Suspense
                boundary so the shell can still prerender.
              */}
              <Suspense fallback={null}>
                <nav className="flex items-center gap-6" aria-label="Main">
                  <NavLink href="/">Projects</NavLink>
                  <NavLink href="/deployments">Deployments</NavLink>
                  <NavLink href="/metrics">Metrics</NavLink>
                  {user?.role === "admin" && (
                    <NavLink href="/users">Users</NavLink>
                  )}
                </nav>
              </Suspense>

              <UserMenu user={user} />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-[#475569]">
          <div className="mx-auto flex max-w-1400 items-center justify-between px-10 py-3 text-xs text-slate-400">
            <span>Local cluster &middot; Minikube</span>
            <span className="font-mono">CACS452 Project III</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
