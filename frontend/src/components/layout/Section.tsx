interface SectionProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  id?: string;
}

const sectionPadding = "px-6 py-24";

export const Section = ({
  id,
  children,
  className,
  innerClassName = "",
}: SectionProps) => {
  return (
    <section id={id} className={className}>
      <div className={`max-w-7xl mx-auto ${sectionPadding} ${innerClassName}`}>
        {children}
      </div>
    </section>
  );
};
