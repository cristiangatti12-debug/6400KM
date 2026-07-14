import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// The trust marker shown next to a verified traveler's name.
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary",
        className
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5" />
      Verified
    </span>
  );
}
