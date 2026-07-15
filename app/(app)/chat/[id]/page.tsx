import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ChatThread, type ChatMessage } from "@/components/ChatThread";

// `id` here is the OTHER person's user id.
export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: otherId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (otherId === user.id) redirect("/chat");

  // You can only chat with an accepted connection.
  const { data: conn } = await supabase
    .from("connections")
    .select("status")
    .or(
      `and(requester_id.eq.${user.id},target_id.eq.${otherId}),and(requester_id.eq.${otherId},target_id.eq.${user.id})`
    )
    .maybeSingle();

  if (!conn || conn.status !== "accepted") redirect(`/profile/${otherId}`);

  const { data: other } = await supabase
    .from("profiles")
    .select("id, display_name, profile_photos")
    .eq("id", otherId)
    .maybeSingle<{
      id: string;
      display_name: string | null;
      profile_photos: string[];
    }>();
  if (!other) notFound();

  const { data: verif } = await supabase
    .from("verifications")
    .select("verified_badge")
    .eq("user_id", otherId)
    .maybeSingle();

  // One conversation per pair, stored with the two ids in a fixed order.
  const [userA, userB] = [user.id, otherId].sort();

  let { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a", userA)
    .eq("user_b", userB)
    .maybeSingle();

  if (!conversation) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ user_a: userA, user_b: userB })
      .select("id")
      .single();
    if (error) {
      // Someone may have created it a moment ago — look it up again.
      const { data: again } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_a", userA)
        .eq("user_b", userB)
        .maybeSingle();
      if (!again) throw error;
      conversation = again;
    } else {
      conversation = created;
    }
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("sent_at", { ascending: true })
    .limit(200);

  const name = other.display_name || "Traveler";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/chat"
          aria-label="Back to chats"
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <Link
          href={`/profile/${otherId}`}
          className="flex items-center gap-2.5 hover:underline"
        >
          <Avatar
            src={other.profile_photos?.[0] ?? null}
            name={name}
            className="w-9 text-sm"
          />
          <span className="flex items-center gap-1.5 font-bold">
            {name}
            {verif?.verified_badge && <VerifiedBadge />}
          </span>
        </Link>
      </div>

      <ChatThread
        conversationId={conversation.id}
        meId={user.id}
        initialMessages={(messages ?? []) as ChatMessage[]}
      />
    </div>
  );
}
