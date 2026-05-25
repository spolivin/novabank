export interface LoanType {
  id: string;
  label: string;
  rateRange: string;
  eligibility: string[];
}

export const LOAN_TYPES: LoanType[] = [
  {
    id: "personal",
    label: "Personal Loan",
    rateRange: "7.99% – 21.99% APR",
    eligibility: [
      "Credit score 650 or higher",
      "Minimum annual income of $24,000",
      "US resident or citizen",
      "Active bank account",
      "Debt-to-income ratio below 45%",
    ],
  },
  {
    id: "mortgage",
    label: "Mortgage",
    rateRange: "5.49% – 7.99% APR",
    eligibility: [
      "Credit score 680 or higher",
      "Down payment of at least 3%",
      "Stable employment history (2+ years)",
      "Debt-to-income ratio below 43%",
      "Property appraisal required",
    ],
  },
  {
    id: "auto",
    label: "Auto Loan",
    rateRange: "4.49% – 12.99% APR",
    eligibility: [
      "Credit score 620 or higher",
      "Vehicle model year 2015 or newer",
      "Minimum loan amount of $5,000",
      "Valid driver's license",
      "Comprehensive insurance required",
    ],
  },
];

export const TERMS = [12, 24, 36, 48, 60] as const;
export type Term = (typeof TERMS)[number];

export const APR = 5.99;
export const AMOUNT_MIN = 1_000;
export const AMOUNT_MAX = 500_000;
export const AMOUNT_DEFAULT = 25_000;
export const TERM_DEFAULT: Term = 36;
