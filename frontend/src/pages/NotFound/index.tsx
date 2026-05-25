import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ROUTES, PAGE_TITLES } from "@/constants";

export default function NotFound() {
  usePageTitle(PAGE_TITLES.NOT_FOUND);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center text-center px-6 py-40"
    >
      <p className="text-brand-accent text-6xl font-bold mb-4">404</p>
      <h1 className="text-brand-fg text-3xl font-bold mb-4">Page not found</h1>
      <p className="text-brand-fg-muted max-w-sm mb-10">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to={ROUTES.HOME}
        className="px-6 py-3 rounded-md bg-brand-accent text-brand-bg font-semibold hover:scale-[1.05] active:scale-[0.98] transition-transform duration-200"
      >
        Back to home
      </Link>
    </motion.div>
  );
}
