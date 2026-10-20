import { Suspense } from "react";
import { getUsers } from "@/lib/api";
import type { User } from "@/lib/types";

// Reads request-time data (cookies), so navigation is declared non-instant.
export const instant = false;

function UserTableSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading users">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-10 rounded-lg bg-[#1B2336] border border-slate-700 animate-pulse"
        />
      ))}
    </div>
  );
}

async function UserList() {
  let users: User[] = [];
  try {
    users = await getUsers();
  } catch {
    return (
      <p className="text-sm text-red-500">
        Could not load users. An administrator account is required.
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
          <th scope="col" className="py-2">Name</th>
          <th scope="col" className="py-2">Email</th>
          <th scope="col" className="py-2">Role</th>
          <th scope="col" className="py-2 text-right">Created</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className="border-t border-[#272F42]">
            <td className="py-2.5">{u.full_name}</td>
            <td className="py-2.5 font-mono text-xs text-slate-300">
              {u.email}
            </td>
            <td className="py-2.5">
              <span
                className={`text-xs uppercase ${
                  u.role === "admin" ? "text-amber-500" : "text-slate-400"
                }`}
              >
                {u.role}
              </span>
            </td>
            <td className="py-2.5 text-right font-mono text-xs text-slate-400">
              {u.created_at.slice(0, 10)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function UsersPage() {
  return (
    <main className="p-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-slate-400">
          Every account registered with the platform. Administrator view.
        </p>
      </div>

      <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
        <Suspense fallback={<UserTableSkeleton />}>
          <UserList />
        </Suspense>
      </section>
    </main>
  );
}
