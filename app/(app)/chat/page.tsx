import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ConnectionRequests } from "@/components/ConnectionRequests";

type MiniProfile = {
  id: string;
  display_name: string | null;
  profile_photos: string[];
};

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: connections } = await supabase
    .from("connections")
    .select("*")
    .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const all = connections ?? [];
  const incoming = all.filter(
    (c) => c.status === "pending" && c.target_id === user.id
  );
  const accepted = all.filter((c) => c.status === "accepted");

  // Fetch the people on the other side of each connection.
  const otherIds = [
    ...new Set(
      [...incoming, ...accepted].map((c) =>
        c.requester_id === user.id ? c.target_id : c.requester_id
      )
    ),
  ];

  const profiles = new Map<string, MiniProfile>();
  const verified = new Set<string>();
  if (otherIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name, profile_photos")
      .in("id", otherIds);
    (profs ?? []).forEach((p: MiniProfile) => profiles.set(p.id, p));

    const { data: v } = await supabase
      .from("verifications")
      .select("user_id")
      .eq("verified_badge", true)
      .in("user_id", otherIds);
    (v ?? []).forEach((x: { user_id: string }) => verified.add(x.user_id));
  }

  const requestItems = incoming.map((c) => {
    const p = profiles.get(c.requester_id);
    return {
      connectionId: c.id,
      userId: c.requester_id,
      name: p?.display_name || "Traveler",
      photo: p?.profile_photos?.[0] ?? null,
      verified: verified.has(c.requester_id),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Chat</h1>

      {requestItems.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Connection requests
          </h2>
          <ConnectionRequests requests={requestItems} />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Messages
        </h2>

        {accepted.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
              <MessageCircle className="h-8 w-8" />
            </div>
            <p className="mx-auto max-w-[280px] text-sm text-muted-foreground">
              No connections yet. Find someone in the Feed, open their profile,
              and send a connection request — once they accept, you can chat.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {accepted.map((c) => {
              const otherId =
                c.requester_id === user.id ? c.target_id : c.requester_id;
              const p = profiles.get(otherId);
              const name = p?.display_name || "Traveler";
              return (
                <li key={c.id}>
                  <Link
                    href={`/chat/${otherId}`}
                    className="flex items-center gap-3 border-b border-border py-3 last:border-0"
                  >
                    <Avatar
                      src={p?.profile_photos?.[0] ?? null}
                      name={name}
                      className="w-11"
                    />
                    <span className="flex flex-1 items-center gap-1.5 font-semibold">
                      {name}
                      {verified.has(otherId) && <VerifiedBadge />}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
