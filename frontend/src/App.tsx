import { Suspense, lazy } from "react";

import { RouterProvider, createBrowserRouter } from "react-router-dom";

import MainLayout from "@/components/layout/Layout";
import PageLoader from "@/components/layout/PageLoader";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ProtectedRoute from "@/components/ui/ProtectedRoute";
import { ROUTES } from "@/constants";
import { AuthProvider } from "@/context/AuthProvider";

const About = lazy(() => import("@/pages/About"));
const Business = lazy(() => import("@/pages/Business"));
const Cards = lazy(() => import("@/pages/Cards"));
const Careers = lazy(() => import("@/pages/Careers"));
const Contact = lazy(() => import("@/pages/Contact"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Home = lazy(() => import("@/pages/Home"));
const Loans = lazy(() => import("@/pages/Loans"));
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Personal = lazy(() => import("@/pages/Personal"));
const Security = lazy(() => import("@/pages/Security"));
const Signup = lazy(() => import("@/pages/Signup"));

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.HOME, element: <Home /> },
      { path: ROUTES.PERSONAL, element: <Personal /> },
      { path: ROUTES.BUSINESS, element: <Business /> },
      { path: ROUTES.CARDS, element: <Cards /> },
      { path: ROUTES.LOANS, element: <Loans /> },
      { path: ROUTES.SECURITY, element: <Security /> },
      { path: ROUTES.ABOUT, element: <About /> },
      { path: ROUTES.CONTACT, element: <Contact /> },
      { path: ROUTES.CAREERS, element: <Careers /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  { path: ROUTES.SIGNUP, element: <Signup /> },
  { path: ROUTES.LOGIN, element: <Login /> },
  {
    path: ROUTES.DASHBOARD,
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <PageLoader>
          <Suspense fallback={<div className="min-h-screen bg-brand-bg" />}>
            <RouterProvider router={router} />
          </Suspense>
        </PageLoader>
      </ErrorBoundary>
    </AuthProvider>
  );
}
