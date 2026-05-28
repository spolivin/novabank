import { RouterProvider, createBrowserRouter } from "react-router-dom";

import MainLayout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/ui/ProtectedRoute";
import { ROUTES } from "@/constants";
import { AuthProvider } from "@/context/AuthContext";
import About from "@/pages/About";
import Business from "@/pages/Business";
import Cards from "@/pages/Cards";
import Careers from "@/pages/Careers";
import Contact from "@/pages/Contact";
import Dashboard from "@/pages/Dashboard";
import Home from "@/pages/Home";
import Loans from "@/pages/Loans";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Personal from "@/pages/Personal";
import Security from "@/pages/Security";
import Signup from "@/pages/Signup";

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
