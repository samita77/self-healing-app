import { useEffect } from "react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";

export default function RouteErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error && error.message
      ? error.message
      : "An unexpected error occurred.";

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 sm:p-6 lg:p-10 text-center">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="max-w-xl text-sm text-ink-muted">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg border border-border px-4 py-2 text-sm hover:border-border"
        >
          Try again
        </button>
        <Link
          to="/"
          className="rounded-lg border border-border px-4 py-2 text-sm hover:border-border"
        >
          Back to projects
        </Link>
      </div>
    </main>
  );
}
