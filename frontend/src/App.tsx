import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import AdminRoute from "@/components/AdminRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import RootLayout from "@/layouts/RootLayout";

const page = (path: string, loader: () => Promise<{ default: ComponentType }>) => ({
  path,
  lazy: async () => ({ Component: (await loader()).default }),
});

const indexPage = (loader: () => Promise<{ default: ComponentType }>) => ({
  index: true as const,
  lazy: async () => ({ Component: (await loader()).default }),
});

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <PublicOnlyRoute />,
        errorElement: <RouteErrorBoundary />,
        children: [
          indexPage(() => import("@/routes/LandingPage")),
          page("login", () => import("@/routes/LoginPage")),
          page("register", () => import("@/routes/RegisterPage")),
        ],
      },
      {
        element: <ProtectedRoute />,
        errorElement: <RouteErrorBoundary />,
        children: [
          page("dashboard", () => import("@/routes/DashboardPage")),
          page("projects/:id", () => import("@/routes/ProjectPage")),
          page("projects/:id/edit", () => import("@/routes/EditProjectPage")),
          page("deployments", () => import("@/routes/DeploymentsPage")),
          page("deployments/:id", () => import("@/routes/DeploymentPage")),
          page("metrics", () => import("@/routes/MetricsPage")),
          page("dora", () => import("@/routes/DoraPage")),
          {
            element: <AdminRoute />,
            errorElement: <RouteErrorBoundary />,
            children: [
              page("admin", () => import("@/routes/AdminPage")),
              page("users", () => import("@/routes/UsersPage")),
            ],
          },
        ],
      },
      page("*", () => import("@/routes/NotFoundPage")),
    ],
  },
]);
