import { Navigate } from "react-router-dom";

import { ROUTES } from "@/constants";
import { useAuth } from "@/context/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return <>{children}</>;
}
