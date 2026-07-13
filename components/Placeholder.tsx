import { type LucideIcon } from "lucide-react";

// Reusable "coming soon" screen for the empty tabs (Sprint 1).
export function Placeholder({
  icon: Icon,
  title,
  note,
}: {
  icon: LucideIcon;
  title: string;
  note: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
        <Icon className="h-8 w-8" strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          {note}
        </p>
      </div>
    </div>
  );
}
