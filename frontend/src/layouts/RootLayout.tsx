import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router";
import { Pulse, Gauge, House, RocketLaunch, UsersThree, Sun, Moon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import UserMenu from "@/components/UserMenu";
import { useCurrentUser } from "@/hooks/useAuth";

const links = [
  { to: "/", label: "Projects", icon: House, end: true },
  { to: "/deployments", label: "Deployments", icon: RocketLaunch },
  { to: "/metrics", label: "Metrics", icon: Pulse },
  { to: "/dora", label: "DORA", icon: Gauge },
];
function navClass({ isActive }: { isActive: boolean }) { return `inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${isActive ? "bg-primary-subtle text-primary dark:bg-primary-subtle dark:text-primary" : "text-ink-muted hover:bg-surface hover:text-ink"}`; }

export default function RootLayout() {
  const { user } = useCurrentUser();
  const [dark, setDark] = useState(() => localStorage.getItem("color-scheme") === "dark");
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); localStorage.setItem("color-scheme", dark ? "dark" : "light"); }, [dark]);
  return <div className="flex min-h-screen flex-col bg-page text-ink">
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-1.5 sm:px-6 lg:px-8">
        <NavLink to="/" end className="shrink-0 text-sm font-semibold tracking-tight text-ink">Self-Healing DevOps</NavLink>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={navClass}><Icon size={17} aria-hidden="true" /><span>{label}</span></NavLink>)}
          {user?.role === "admin" && <NavLink to="/admin" className={navClass}><UsersThree size={17} aria-hidden="true" /><span>Admin</span></NavLink>}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setDark((value) => !value)} aria-label={`Switch to ${dark ? "light" : "dark"} mode`} className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink"><span aria-hidden="true">{dark ? <Sun size={18}/> : <Moon size={18}/>}</span></button>
          <UserMenu user={user} />
        </div>
      </div>
    </header>
    <div className="flex-1"><AnimatePresence mode="wait" initial={false}><motion.div key={location.pathname} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: .16 }} className="min-h-full motion-reduce:transform-none"><Outlet /></motion.div></AnimatePresence></div>
    <footer className="mt-auto border-t border-border"><div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 text-xs text-ink-muted sm:px-6 lg:px-8"><span>Local cluster · Minikube</span><span className="font-mono">CACS452 Project III</span></div></footer>
  </div>;
}
