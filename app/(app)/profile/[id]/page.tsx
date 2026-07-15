import { notFound, redirect } from "next/navigation";
import { MapPin, Cake, Link2, AtSign, Grid3x3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Post, Profile, Verification } from "@/lib/types";
import { budgetLabel } from "@/lib/profileOptions";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { PostGrid } from "@/components/PostGrid";
import { ConnectButton, type ConnectState } from "@/components/ConnectButton";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Your own profile has its own page (with editing).
  if (id === user.id) redirect("/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle<Profile>();
  if (!profile) notFound();

  const { data: verification } = await supabase
    .from("verifications")
    .select("*")
    .eq("user_id", id)
    .maybeSingle<Verification>();

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", id)
    .order("created_at", { ascending: false });

  // Work out where we stand with this person.
  const { data: conn } = await supabase
    .from("connections")
    .select("*")
    .or(
      `and(requester_id.eq.${user.id},target_id.eq.${id}),and(requester_id.eq.${id},target_id.eq.${user.id})`
    )
    .maybeSingle();

  let state: ConnectState = "none";
  if (conn) {
    if (conn.status === "accepted") state = "connected";
    else state = conn.requester_id === user.id ? "outgoing" : "incoming";
  }

  const name = profile.display_name || "Traveler";
  const mainPhoto = profile.profile_photos?.[0] ?? null;
  const budget = budgetLabel(profile.budget_level);
  const details = [
    profile.home_base && { icon: MapPin, text: profile.home_base },
    profile.age && { icon: Cake, text: `${profile.age}` },
  ].filter(Boolean) as { icon: typeof MapPin; text: string }[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar src={mainPhoto} name={name} className="w-20 text-2xl" />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">{name}</h1>
            {verification?.verified_badge && <VerifiedBadge />}
          </div>
          {details.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {details.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  <d.icon className="h-4 w-4" />
                  {d.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConnectButton
        meId={user.id}
        otherId={id}
        initialState={state}
        connectionId={conn?.id ?? null}
      />

      {profile.bio && (
        <p className="whitespace-pre-line text-[15px] leading-relaxed">
          {profile.bio}
        </p>
      )}

      {(verification?.linkedin_url || verification?.instagram_handle) && (
        <div className="flex flex-wrap gap-2">
          {verification.linkedin_url && (
            <a
              href={verification.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-accent"
            >
              <Link2 className="h-4 w-4" />
              LinkedIn
            </a>
          )}
          {verification.instagram_handle && (
            <a
              href={`https://instagram.com/${verification.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-accent"
            >
              <AtSign className="h-4 w-4" />@{verification.instagram_handle}
            </a>
          )}
        </div>
      )}

      {budget && <Chips title="Typical budget" items={[budget]} />}
      {profile.travel_interests?.length > 0 && (
        <Chips title="Travel interests" items={profile.travel_interests} />
      )}
      {profile.trip_styles?.length > 0 && (
        <Chips title="Trip style" items={profile.trip_styles} />
      )}

      <section className="flex flex-col gap-2">
        <h2 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Grid3x3 className="h-3.5 w-3.5" />
          Posts
        </h2>
        {posts && posts.length > 0 ? (
          <PostGrid posts={posts as Post[]} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {name} hasn&apos;t posted yet.
          </p>
        )}
      </section>
    </div>
  );
}

function Chips({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((t) => (
          <span
            key={t}
            className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
          >
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}
