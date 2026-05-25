import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { ROUTES } from "@/constants";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return <>{children}</>;
}
