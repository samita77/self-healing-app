import { Navigate, Outlet } from "react-router";
import FullPageLoading from "@/components/FullPageLoading";
import { useCurrentUser } from "@/hooks/useAuth";

/** Login/register/landing: signed-in visitors go straight to the dashboard. */
export default function PublicOnlyRoute() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) return <FullPageLoading label="Checking your session…" />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
