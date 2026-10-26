import { Outlet, ScrollRestoration } from "react-router-dom";

import DemoBanner from "@/components/layout/DemoBanner";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollRestoration />
      <DemoBanner />
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
