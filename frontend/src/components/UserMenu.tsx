import { useNavigate } from "react-router";
import { useLogout } from "@/hooks/useAuth";
import type { User } from "@/lib/types";

export default function UserMenu({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const logout = useLogout();

  if (!user) return null;

  async function signOut() {
    await logout.mutateAsync();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400">
        {user.email}
        <span className="ml-2 uppercase tracking-wide">{user.role}</span>
      </span>

      <button
        type="button"
        onClick={signOut}
        disabled={logout.isPending}
        className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-200 disabled:opacity-50"
      >
        Sign out
      </button>
    </div>
  );
}
