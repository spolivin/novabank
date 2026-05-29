import { useState } from "react";

import { Link, Navigate, useNavigate } from "react-router-dom";

import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { z } from "zod";

import { PAGE_TITLES, ROUTES } from "@/constants";
import { useAuth } from "@/context/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type FormState = z.input<typeof loginSchema>;
type FormErrors = Partial<Record<keyof FormState, string>>;

export default function Login() {
  usePageTitle(PAGE_TITLES.LOGIN);

  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!authLoading && isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError("");

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])) as FormErrors
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setSubmitError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      setLoading(false);
      navigate(ROUTES.DASHBOARD);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-brand-surface rounded-2xl p-8 shadow-xl"
      >
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-1.5 text-brand-fg-muted hover:text-brand-fg text-sm transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Home
        </Link>

        <h1 className="text-2xl font-bold text-brand-fg mb-1">Welcome back</h1>
        <p className="text-brand-fg-muted text-sm mb-8">
          Don't have an account?{" "}
          <Link to={ROUTES.SIGNUP} className="text-brand-accent hover:underline font-medium">
            Sign up
          </Link>
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Field label="Email" error={errors.email}>
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              className={inputClass(!!errors.email)}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                className={inputClass(!!errors.password) + " pr-11"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-fg-muted hover:text-brand-fg transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          {submitError && <p className="text-red-400 text-sm">{submitError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-brand-accent text-brand-bg font-semibold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-[0_4px_16px_rgba(0,201,167,0.35)] active:scale-[0.98] transition-[transform,box-shadow] duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Logging in…
              </>
            ) : (
              "Log in"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-brand-fg text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return [
    "w-full h-12 rounded-xl bg-brand-bg border px-4 text-sm text-brand-fg placeholder:text-brand-fg-muted outline-none transition-colors",
    hasError ? "border-red-400 focus:border-red-400" : "border-white/10 focus:border-brand-accent",
  ].join(" ");
}
