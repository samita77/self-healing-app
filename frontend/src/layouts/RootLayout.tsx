import { NavLink, Outlet } from "react-router";
import UserMenu from "@/components/UserMenu";
import { useCurrentUser } from "@/hooks/useAuth";

function navClass({ isActive }: { isActive: boolean }) {
  return `text-sm transition-colors ${
    isActive ? "text-slate-50" : "text-slate-400 hover:text-slate-200"
  }`;
}

export default function RootLayout() {
  const { user } = useCurrentUser();

  return (
    <div className="min-h-full flex flex-col bg-[#0F172A] text-[#F8FAFC]">
      <header className="border-b border-[#475569]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-10 py-4">
          <NavLink to="/" end className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full bg-[#22C55E]"
            />
            <span className="text-sm font-semibold">Self-Healing DevOps</span>
          </NavLink>

          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6" aria-label="Main">
              <NavLink to="/" end className={navClass}>
                Projects
              </NavLink>
              <NavLink to="/deployments" className={navClass}>
                Deployments
              </NavLink>
              <NavLink to="/metrics" className={navClass}>
                Metrics
              </NavLink>
              <NavLink to="/dora" className={navClass}>
                DORA
              </NavLink>
              {user?.role === "admin" && (
                <NavLink to="/admin" className={navClass}>
                  Admin
                </NavLink>
              )}
            </nav>

            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <div className="flex-1">{<Outlet />}</div>

      <footer className="border-t border-[#475569]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-10 py-3 text-xs text-slate-400">
          <span>Local cluster &middot; Minikube</span>
          <span className="font-mono">CACS452 Project III</span>
        </div>
      </footer>
    </div>
  );
}
