import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import Personal from "@/pages/Personal";
import Business from "@/pages/Business";
import Cards from "@/pages/Cards";
import Loans from "@/pages/Loans";
import Security from "@/pages/Security";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Careers from "@/pages/Careers";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import ProtectedRoute from "@/components/ui/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";

import { ROUTES } from "@/constants";

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
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
