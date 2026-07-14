// Preset choices offered on the profile edit screen.

export const TRAVEL_INTERESTS = [
  "Beaches",
  "Hiking",
  "City breaks",
  "Food & wine",
  "Nightlife",
  "Museums & art",
  "Nature & wildlife",
  "Road trips",
  "Backpacking",
  "Photography",
  "Festivals",
  "Water sports",
  "Skiing",
  "Wellness & yoga",
];

export const TRIP_STYLES = [
  "Spontaneous",
  "Well-planned",
  "Slow travel",
  "Adventure",
  "Relaxation",
  "Solo-friendly",
  "Social & party",
  "Off the beaten path",
];

export const BUDGET_LEVELS = [
  { value: "shoestring", label: "Shoestring" },
  { value: "budget", label: "Budget" },
  { value: "comfort", label: "Comfort" },
  { value: "luxury", label: "Luxury" },
];

export function budgetLabel(value: string | null): string | null {
  return BUDGET_LEVELS.find((b) => b.value === value)?.label ?? null;
}
