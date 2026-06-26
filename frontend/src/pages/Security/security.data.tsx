import { Check } from "lucide-react";

export const features = [
  {
    icon: <img src="/icons/Security/AES-256-Protection.svg" alt="" />,
    title: "AES-256 Protection",
    description:
      "Every bit of your data - at rest and in transit - is protected with AES-256 encryption, the same standard used by governments and the world's largest financial institutions.",
    tag: "Military grade encryption",
  },
  {
    icon: <img src="/icons/Security/Biometric-Authentification.svg" alt="" />,
    title: "Biometric Authentification",
    description:
      "Face ID, Touch ID, and fingerprint recognition ensure only you can access your account. Multi-factor authentication adds an extra layer that blocks unauthorized access.",
    tag: "You are the password",
  },
  {
    icon: <img src="/icons/Security/FDIC-Insured.svg" alt="" />,
    title: "FDIC Insured",
    description:
      "Your deposits are insured by the Federal Deposit Insurance Corporation up to $250.000 per depositor. Even in the unlikely event of a bank failure, your money is safe.",
    tag: "Up to $250.000 protected",
  },
];

export const securityFeatures = [
  {
    icon: <Check />,
    tag: "PCI-DSS Level 1",
    description: "Payment card industry security standard",
  },
  {
    icon: <Check />,
    tag: "SOC 2 Type II",
    description: "Independently audited security controls",
  },
  {
    icon: <Check />,
    tag: "GDPR Compliant",
    description: "Full compliance with data privacy regulations",
  },
  {
    icon: <Check />,
    tag: "ISO 27001",
    description: "International information security standard",
  },
];
