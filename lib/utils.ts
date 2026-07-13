import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merges Tailwind class names safely (later classes win over earlier ones).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
