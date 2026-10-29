import { useUsers } from "@/hooks/useReferenceData";

function UserTableSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading users">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-10 rounded-lg bg-card border border-border animate-pulse"
        />
      ))}
    </div>
  );
}

export default function UsersPage() {
  const { data: users, isLoading, isError } = useUsers();

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Every account registered with the platform. Administrator view.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        {isLoading ? (
          <UserTableSkeleton />
        ) : isError ? (
          <p className="text-sm text-failed">
            Could not load users. An administrator account is required.
          </p>
        ) : !users || users.length === 0 ? (
          <p className="text-sm text-ink-muted">No accounts registered yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                <th scope="col" className="py-2">Name</th>
                <th scope="col" className="py-2">Email</th>
                <th scope="col" className="py-2">Role</th>
                <th scope="col" className="py-2 text-right">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="py-2.5">{u.full_name}</td>
                  <td className="py-2.5 font-mono text-xs text-ink-muted">
                    {u.email}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`text-xs uppercase ${
                        u.role === "admin" ? "text-warning" : "text-ink-muted"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs text-ink-muted">
                    {u.created_at.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
