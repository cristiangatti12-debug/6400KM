import { cn } from "@/lib/utils";

// The Serai brand mark: a rounded badge holding a "journey" —
// a curved dashed route between two points, in calm teal tones.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label="Serai logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="11" fill="url(#logoGrad)" />
      <path
        d="M11 28 C 16 20, 24 20, 29 12"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeDasharray="0.1 5"
        strokeLinecap="round"
      />
      <circle cx="11" cy="28" r="3" fill="#ffffff" />
      <path
        d="M29 8 c 3.2 0 5.5 2.5 5.5 5.6 C 34.5 17 29 22 29 22 s -5.5 -5 -5.5 -8.4 C 23.5 10.5 25.8 8 29 8 Z"
        fill="#ffffff"
      />
      <circle cx="29" cy="13.4" r="2" fill="#0d9488" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={cn("h-8 w-8", markClassName)} />
      <span className="text-xl font-extrabold tracking-tight text-foreground">
        Ser<span className="text-primary">ai</span>
      </span>
    </span>
  );
}
