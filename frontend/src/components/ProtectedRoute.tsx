import { Navigate, Outlet } from "react-router";
import FullPageLoading from "@/components/FullPageLoading";
import { useCurrentUser } from "@/hooks/useAuth";
import { tokenStore } from "@/lib/session";

/**
 * Client-side guard. This is a UX boundary only - the backend still rejects
 * unauthenticated requests with 401 and non-admins with 403.
 */
export default function ProtectedRoute() {
  const { user, isLoading } = useCurrentUser();

  if (!tokenStore.has()) return <Navigate to="/login" replace />;
  if (isLoading) return <FullPageLoading label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
