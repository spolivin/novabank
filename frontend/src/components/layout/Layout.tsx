import { Outlet, ScrollRestoration } from "react-router-dom";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollRestoration />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
