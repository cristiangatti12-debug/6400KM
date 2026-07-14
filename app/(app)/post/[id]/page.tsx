import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Route, Pencil } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { DeletePostButton } from "@/components/DeletePostButton";
import { MapPreview } from "@/components/MapPreview";
import { buttonVariants } from "@/components/ui/button";
import { toPostCard } from "@/lib/mapPost";

export default async function PostPage({
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

  const { data: post } = await supabase
    .from("posts")
    .select(
      "*, author:profiles(id, display_name, profile_photos), itinerary:itineraries(title, destinations, days, stop_points)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  const { data: verif } = await supabase
    .from("verifications")
    .select("verified_badge")
    .eq("user_id", post.author_id)
    .maybeSingle();

  const isAuthor = post.author_id === user.id;
  const itinerary = Array.isArray(post.itinerary)
    ? post.itinerary[0]
    : post.itinerary;
  const stopPoints = itinerary?.stop_points ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PostCard post={toPostCard(post, verif?.verified_badge ?? false)} />

      {stopPoints.length > 0 && (
        <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
          <h2 className="inline-flex items-center gap-1.5 text-sm font-bold">
            <Route className="h-4 w-4 text-primary" />
            Route
          </h2>
          <MapPreview stops={stopPoints} height={220} />
        </section>
      )}
      {isAuthor && (
        <div className="flex flex-wrap items-start gap-2">
          <Link
            href={`/post/${post.id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Pencil className="h-4 w-4" />
            Edit post
          </Link>
          <DeletePostButton
            postId={post.id}
            itineraryId={post.itinerary_id ?? null}
            media={post.media ?? []}
          />
        </div>
      )}
    </div>
  );
}
