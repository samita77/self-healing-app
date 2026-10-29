import { CaretDown, SignOut } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useLogout } from "@/hooks/useAuth";
import type { User } from "@/lib/types";
import DropdownMenu from "@/components/ui/DropdownMenu";
import Button from "@/components/ui/Button";

export default function UserMenu({ user }: { user: User | null }) {
  const navigate = useNavigate(); const logout = useLogout();
  if (!user) return <div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign in</Button><Button size="sm" onClick={() => navigate("/register")}>Create account</Button></div>;
  async function signOut() { await logout.mutateAsync(); navigate("/login", { replace: true }); }
  return <DropdownMenu trigger={<span className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-surface"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary-subtle text-xs font-semibold uppercase text-primary">{user.full_name.slice(0, 1)}</span><span className="hidden max-w-40 sm:block"><span className="block truncate text-xs font-medium text-ink">{user.full_name}</span><span className="block text-[11px] capitalize text-ink-muted">{user.role}</span></span><CaretDown size={14} className="text-ink-muted" aria-hidden="true" /></span>}>
    <div className="px-3 py-2"><p className="truncate text-xs font-medium">{user.email}</p><p className="mt-0.5 text-xs capitalize text-ink-muted">{user.role} account</p></div><div className="my-1 border-t border-border" /><button role="menuitem" type="button" disabled={logout.isPending} onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-failed hover:bg-failed-subtle disabled:opacity-50"><SignOut size={16} aria-hidden="true" />{logout.isPending ? "Signing out…" : "Sign out"}</button>
  </DropdownMenu>;
}
