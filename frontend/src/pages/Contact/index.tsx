import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Phone, Mail, CheckCircle } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PAGE_TITLES } from "@/constants";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email address"),
  subject: z.enum(["General", "Support", "Partnership", "Careers"], {
    error: "Please select a subject",
  }),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

const SUBJECTS = ["General", "Support", "Partnership", "Careers"] as const;

function FieldError({ message, id }: { message?: string; id: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          id={id}
          role="alert"
          className="mt-1 text-sm text-brand-error"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

const inputBase =
  "w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-fg placeholder-brand-fg-muted focus:outline-none focus:border-brand-accent transition-colors";

const inputError = "border-brand-error focus:border-brand-error";

export default function Contact() {
  usePageTitle(PAGE_TITLES.CONTACT);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onSubmit() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setSubmitted(true);
        resolve();
      }, 600);
    });
  }

  return (
    <>
      <PageHero
        variant="centered"
        badge="Get in touch"
        heading={
          <>
            We&apos;re here to <span className="text-brand-accent">help you</span>
          </>
        }
        subheading="Have a question, a partnership idea, or just want to say hello? Fill out the form and we'll get back to you within one business day."
      />

      <Section>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid lg:grid-cols-5 gap-12"
        >
          {/* Contact info */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-bold text-brand-fg mb-6">Contact information</h2>
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-brand-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-brand-fg-muted uppercase tracking-wider mb-1">
                      Office
                    </p>
                    <p className="text-brand-fg">142 Innovation Drive, Suite 800</p>
                    <p className="text-brand-fg">San Francisco, CA 94107</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-brand-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-brand-fg-muted uppercase tracking-wider mb-1">
                      Phone
                    </p>
                    <p className="text-brand-fg">+1 (800) 668-2265</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-brand-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-brand-fg-muted uppercase tracking-wider mb-1">
                      Email
                    </p>
                    <p className="text-brand-fg">hello@novabank.io</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-8">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    className="flex flex-col items-center justify-center text-center py-12 gap-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-brand-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-fg">Message sent!</h3>
                    <p className="text-brand-fg-muted max-w-sm">
                      Thanks for reaching out. We'll get back to you within one business day.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    noValidate
                  >
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-brand-fg mb-1.5">
                          Name
                        </label>
                        <input
                          {...register("name")}
                          placeholder="Jane Smith"
                          aria-invalid={!!errors.name}
                          aria-describedby={errors.name ? "name-error" : undefined}
                          className={`${inputBase} ${errors.name ? inputError : ""}`}
                        />
                        <FieldError id="name-error" message={errors.name?.message} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-brand-fg mb-1.5">
                          Email
                        </label>
                        <input
                          {...register("email")}
                          type="email"
                          placeholder="jane@example.com"
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? "email-error" : undefined}
                          className={`${inputBase} ${errors.email ? inputError : ""}`}
                        />
                        <FieldError id="email-error" message={errors.email?.message} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-fg mb-1.5">
                        Subject
                      </label>
                      <select
                        {...register("subject")}
                        aria-invalid={!!errors.subject}
                        aria-describedby={errors.subject ? "subject-error" : undefined}
                        className={`${inputBase} ${errors.subject ? inputError : ""}`}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select a subject
                        </option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <FieldError id="subject-error" message={errors.subject?.message} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-fg mb-1.5">
                        Message
                      </label>
                      <textarea
                        {...register("message")}
                        rows={5}
                        placeholder="How can we help?"
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? "message-error" : undefined}
                        className={`${inputBase} resize-none ${errors.message ? inputError : ""}`}
                      />
                      <FieldError id="message-error" message={errors.message?.message} />
                    </div>

                    <Button variant="primary" fullWidth disabled={isSubmitting}>
                      {isSubmitting ? "Sending…" : "Send message"}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </Section>
    </>
  );
}
