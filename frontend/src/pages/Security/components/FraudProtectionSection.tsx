import { Check } from "lucide-react";
import { motion } from "motion/react";

import { scrollAnimation } from "@/animations";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

const bullets = [
  "Instant push notifications on every transaction",
  "One-tap card freeze from the mobile app",
  "Automatic block on suspicious international activity",
  "24/7 fraud team reachable by chat or phone",
];

export const FraudProtectionSection = () => (
  <Section className="bg-brand-surface">
    <motion.div
      {...scrollAnimation}
      className="grid grid-cols-1 md:grid-cols-2 items-center gap-10"
    >
      <div>
        <h2 className="text-brand-fg text-4xl font-bold mb-10">Real-time Fraud Protection</h2>
        <div className="flex flex-col gap-8 text-brand-fg-muted">
          <p>
            NovaBank monitors every transaction 24/7 using machine learning models trained on
            billions of data points. Suspicious activity triggers instant alerts and automatic
            account safeguards before damage can occur.
          </p>
          <p>
            Our dedicated fraud team works around the clock to investigate anomalies. If you ever
            spot something wrong, freeze your account instantly in-app and our team will be on the
            case within minutes.
          </p>
          <ul className="space-y-3 max-w-sm">
            {bullets.map((item) => (
              <li key={item} className="flex items-center gap-3 text-brand-fg-muted">
                <Check className="text-brand-accent flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col gap-5 bg-brand-accent/10 p-10 rounded-3xl">
        <div className="flex items-center justify-center text-brand-fg bg-brand-accent rounded-full w-10 h-10">
          <Check />
        </div>
        <h2 className="font-bold text-brand-fg text-xl">Zero-liability guarantee</h2>
        <p className="text-brand-fg-muted">
          If an unauthorized transaction ever appears on your account, we will refund it - no
          questions asked. You are never responsible for fraudulent charges made without your
          authorization.
        </p>
        <Button variant="accentCard" fullWidth>
          $0 liability on all unauthorized transactions
        </Button>
      </div>
    </motion.div>
  </Section>
);
