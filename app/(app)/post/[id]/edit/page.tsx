import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "@/components/PostForm";

export default async function EditPostPage({
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
      "*, itinerary:itineraries(id, title, destinations, stop_points, days, budget_level, interest_tags)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();
  // Only the author may edit their own post.
  if (post.author_id !== user.id) redirect(`/post/${id}`);

  const itin = Array.isArray(post.itinerary) ? post.itinerary[0] : post.itinerary;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Edit post</h1>
      <PostForm
        userId={user.id}
        mode="edit"
        initial={{
          postId: post.id,
          caption: post.caption ?? null,
          destination: post.destination ?? null,
          media: post.media ?? [],
          itineraryId: itin?.id ?? post.itinerary_id ?? null,
          itinerary: itin
            ? {
                title: itin.title ?? null,
                destinations: itin.destinations ?? [],
                stop_points: itin.stop_points ?? [],
                days: itin.days ?? null,
                budget_level: itin.budget_level ?? null,
                interest_tags: itin.interest_tags ?? [],
              }
            : null,
        }}
      />
    </div>
  );
}
