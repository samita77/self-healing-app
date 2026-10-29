import { Navigate, Outlet } from "react-router";
import { useCurrentUser } from "@/hooks/useAuth";

export default function AdminRoute() {
  const { user } = useCurrentUser();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
