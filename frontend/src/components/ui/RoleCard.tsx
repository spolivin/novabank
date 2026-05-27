import { Button } from "@/components/ui/Button";

export type Department = "Engineering" | "Design" | "Operations";
type EmploymentType = "Full-time" | "Part-time" | "Contract";

export interface RoleProps {
  title: string;
  department: Department;
  location: string;
  type: EmploymentType;
  description: string;
  stack: string[];
}

export const RoleCard = ({ title, department, location, type, description, stack }: RoleProps) => {
  return (
    <div className="flex flex-col rounded-xl gap-4 text-brand-fg bg-brand-surface p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <span className="self-start bg-brand-accent/20 text-brand-accent text-xs font-medium px-4 py-2 rounded-full">
        {department}
      </span>
      <p className="italic">
        {location} / {type}
      </p>
      <p className="text-brand-fg-muted">{description}</p>
      <div className="flex flex-wrap gap-2">
        {stack.map((tech) => (
          <span
            key={tech}
            className="bg-brand-bg text-brand-fg-muted text-xs font-medium px-3 py-1 rounded-full"
          >
            {tech}
          </span>
        ))}
      </div>
      <div className="self-start">
        <Button variant="secondary" href="/contact">
          Apply
        </Button>
      </div>
    </div>
  );
};
