import { cn } from "@/lib/utils";

// Shows a profile photo, or the person's initial on a soft teal circle.
export function Avatar({
  src,
  name,
  className,
}: {
  src?: string | null;
  name?: string | null;
  className?: string;
}) {
  const initial = (name || "").trim().charAt(0).toUpperCase() || "?";

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name ? `${name}'s photo` : "Profile photo"}
        className={cn(
          "aspect-square rounded-full object-cover bg-muted",
          className
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex aspect-square items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground",
        className
      )}
    >
      {initial}
    </span>
  );
}
