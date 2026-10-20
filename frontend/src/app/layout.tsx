import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import NavLink from "@/components/NavLink";
import { Suspense } from "react";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
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

            <nav className="flex items-center gap-6" aria-label="Main">
              {/*
                NavLink reads usePathname(), which is request-time URL data.
                Under cacheComponents that must sit inside a Suspense
                boundary so the shell can still prerender.
              */}
              <Suspense fallback={null}>
                <NavLink href="/">Projects</NavLink>
                <NavLink href="/deployments">Deployments</NavLink>
                <NavLink href="/metrics">Metrics</NavLink>
              </Suspense>
            </nav>
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
