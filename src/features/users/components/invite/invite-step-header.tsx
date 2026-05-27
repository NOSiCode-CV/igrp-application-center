import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface InviteStepHeaderProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  tone?: "neutral" | "warning" | "destructive" | "success";
}

const TONE: Record<NonNullable<InviteStepHeaderProps["tone"]>, string> = {
  neutral: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
};

export function InviteStepHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  tone = "neutral",
}: InviteStepHeaderProps) {
  return (
    <header className="flex flex-col items-center gap-4 text-center">
      <div
        className={`inline-flex size-14 items-center justify-center rounded-2xl ${TONE[tone]}`}
      >
        <Icon aria-hidden="true" className="size-7" strokeWidth={1.75} />
      </div>
      <div className="flex flex-col gap-2">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground text-balance">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
