import { redirect } from "next/navigation";
import { Map, Route, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { budgetLabel } from "@/lib/profileOptions";

export default async function ItinerariesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("itineraries")
    .select("*, author:profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itineraries = (rows ?? []) as any[];

  if (itineraries.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
          <Map className="h-8 w-8" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">No itineraries yet</h1>
          <p className="mx-auto max-w-[280px] text-sm text-muted-foreground">
            Itineraries appear here when people add one to a post.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Itineraries</h1>
      {itineraries.map((it) => {
        const author = Array.isArray(it.author) ? it.author[0] : it.author;
        const stops: string[] = it.destinations ?? [];
        const budget = budgetLabel(it.budget_level);
        return (
          <article
            key={it.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex flex-col gap-1">
              <h2 className="font-bold">
                {it.title || stops.join(" → ") || "Itinerary"}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {it.days && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {it.days} {it.days === 1 ? "day" : "days"}
                  </span>
                )}
                {budget && <span>{budget}</span>}
                {author?.display_name && <span>by {author.display_name}</span>}
              </div>
            </div>

            {stops.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
                <Route className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{stops.join("  →  ")}</span>
              </div>
            )}

            {(it.interest_tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {it.interest_tags.map((t: string) => (
                  <span
                    key={t}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
