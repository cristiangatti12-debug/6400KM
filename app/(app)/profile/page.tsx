import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Pencil, MapPin, Cake, Link2, AtSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Verification } from "@/lib/types";
import { budgetLabel } from "@/lib/profileOptions";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { TrustSection } from "@/components/TrustSection";
import { buttonVariants } from "@/components/ui/button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const { data: verification } = await supabase
    .from("verifications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Verification>();

  const verif: Verification = verification ?? {
    user_id: user.id,
    id_review_status: "none",
    id_selfie_path: null,
    id_document_path: null,
    linkedin_url: null,
    instagram_handle: null,
    phone_verified: false,
    verified_badge: false,
  };

  const name = profile?.display_name || user.email?.split("@")[0] || "You";
  const mainPhoto = profile?.profile_photos?.[0] ?? null;
  const isVerified = verif.verified_badge;
  const interests = profile?.travel_interests ?? [];
  const tripStyles = profile?.trip_styles ?? [];
  const budget = budgetLabel(profile?.budget_level ?? null);
  const details = [
    profile?.home_base && { icon: MapPin, text: profile.home_base },
    profile?.age && { icon: Cake, text: `${profile.age}` },
  ].filter(Boolean) as { icon: typeof MapPin; text: string }[];

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center gap-4">
        <Avatar src={mainPhoto} name={name} className="w-20 text-2xl" />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">{name}</h1>
            {isVerified && <VerifiedBadge />}
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

      <Link
        href="/profile/edit"
        className={buttonVariants({ variant: "outline" })}
      >
        <Pencil className="h-4 w-4" />
        Edit profile
      </Link>

      {/* Booster links */}
      {(verif.linkedin_url || verif.instagram_handle) && (
        <div className="flex flex-wrap gap-2">
          {verif.linkedin_url && (
            <a
              href={verif.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-accent"
            >
              <Link2 className="h-4 w-4" />
              LinkedIn
            </a>
          )}
          {verif.instagram_handle && (
            <a
              href={`https://instagram.com/${verif.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-accent"
            >
              <AtSign className="h-4 w-4" />@{verif.instagram_handle}
            </a>
          )}
        </div>
      )}

      {/* Bio */}
      {profile?.bio && (
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground">
          {profile.bio}
        </p>
      )}

      {/* Budget */}
      {budget && (
        <Section title="Typical budget">
          <Chip>{budget}</Chip>
        </Section>
      )}

      {/* Interests */}
      {interests.length > 0 && (
        <Section title="Travel interests">
          <div className="flex flex-wrap gap-2">
            {interests.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </Section>
      )}

      {/* Trip styles */}
      {tripStyles.length > 0 && (
        <Section title="Trip style">
          <div className="flex flex-wrap gap-2">
            {tripStyles.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </Section>
      )}

      {/* Extra photos */}
      {(profile?.profile_photos?.length ?? 0) > 1 && (
        <Section title="Photos">
          <div className="grid grid-cols-3 gap-3">
            {profile!.profile_photos.slice(1).map((url) => (
              <div
                key={url}
                className="aspect-square overflow-hidden rounded-xl bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Empty-state nudge */}
      {!profile?.display_name && (
        <p className="rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
          Your profile is empty. Tap{" "}
          <span className="font-semibold">Edit profile</span> to add your name,
          photos, and travel interests.
        </p>
      )}

      {/* Trust & verification */}
      <TrustSection verification={verif} userId={user.id} />

      {/* Log out */}
      <form action="/auth/signout" method="post" className="pt-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
      {children}
    </span>
  );
}
