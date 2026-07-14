import Link from "next/link";
import { redirect } from "next/navigation";
import { Images, PlusSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/PostCard";
import { toPostCard } from "@/lib/mapPost";
import { buttonVariants } from "@/components/ui/button";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("posts")
    .select(
      "*, author:profiles(id, display_name, profile_photos), itinerary:itineraries(title, destinations, days)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = (rows ?? []) as any[];

  // Which authors are verified?
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const verified = new Set<string>();
  if (authorIds.length) {
    const { data: v } = await supabase
      .from("verifications")
      .select("user_id")
      .eq("verified_badge", true)
      .in("user_id", authorIds);
    (v ?? []).forEach((x: { user_id: string }) => verified.add(x.user_id));
  }

  if (posts.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
          <Images className="h-8 w-8" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">No posts yet</h1>
          <p className="mx-auto max-w-[280px] text-sm text-muted-foreground">
            Be the first to share a trip — it&apos;ll appear here for everyone.
          </p>
        </div>
        <Link href="/new" className={buttonVariants()}>
          <PlusSquare className="h-4 w-4" />
          Create a post
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {posts.map((row) => (
        <PostCard
          key={row.id}
          post={toPostCard(row, verified.has(row.author_id))}
        />
      ))}
    </div>
  );
}
