import { useState } from "react";

export interface AccordionItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export interface AccordionGroupProps {
  items: AccordionItem[];
}

const Accordion = ({ title, children, isOpen, onToggle }: AccordionProps) => {
  return (
    <div className="bg-brand-surface text-brand-fg px-5 py-4 rounded-lg">
      <button className="flex justify-between items-center w-full" onClick={onToggle}>
        {title}{" "}
        <span
          className={`inline-block text-xs text-brand-accent transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>
      <div
        className={`transition-[max-height] duration-200 overflow-hidden ${isOpen ? "max-h-96" : "max-h-0"}`}
      >
        <p className="pt-3 text-brand-fg-muted">{children}</p>
      </div>
    </div>
  );
};

export const AccordionGroup = ({ items }: AccordionGroupProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        return (
          <Accordion
            key={item.question}
            title={item.question}
            isOpen={openIndex === i}
            onToggle={() => {
              if (openIndex === i) {
                setOpenIndex(null);
              } else {
                setOpenIndex(i);
              }
            }}
          >
            {item.answer}
          </Accordion>
        );
      })}
    </div>
  );
};
