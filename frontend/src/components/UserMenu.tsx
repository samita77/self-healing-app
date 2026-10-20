"use client";

import { useRouter } from "next/navigation";
import { logout } from "../app/actions";

type Props = {
  user: { email: string; role: string } | null;
};

export default function UserMenu({ user }: Props) {
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400">
        {user.email}
        <span className="ml-2 uppercase tracking-wide">{user.role}</span>
      </span>

      <button
        type="button"
        onClick={async () => {
          await logout();
          router.push("/login");
        }}
        className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-200"
      >
        Sign out
      </button>
    </div>
  );
}
