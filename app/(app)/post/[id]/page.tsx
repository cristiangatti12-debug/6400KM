import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/PostCard";
import { DeletePostButton } from "@/components/DeletePostButton";
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
      "*, author:profiles(id, display_name, profile_photos), itinerary:itineraries(title, destinations, days)"
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

  return (
    <div className="flex flex-col gap-4">
      <PostCard post={toPostCard(post, verif?.verified_badge ?? false)} />
      {isAuthor && (
        <DeletePostButton
          postId={post.id}
          itineraryId={post.itinerary_id ?? null}
          media={post.media ?? []}
        />
      )}
    </div>
  );
}
