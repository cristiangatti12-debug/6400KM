import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { ProfileEditForm } from "@/components/ProfileEditForm";

export default async function EditProfilePage() {
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

  // Fall back to an empty profile object if the row isn't there yet.
  const initial: Profile = profile ?? {
    id: user.id,
    display_name: null,
    age: null,
    home_base: null,
    bio: null,
    travel_interests: [],
    budget_level: null,
    trip_styles: [],
    profile_photos: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Edit profile</h1>
      <ProfileEditForm profile={initial} />
    </div>
  );
}
