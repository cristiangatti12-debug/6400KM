"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MediaItem } from "@/lib/types";
import { Button } from "@/components/ui/button";

// Only rendered for the author of the post.
export function DeletePostButton({
  postId,
  itineraryId,
  media,
}: {
  postId: string;
  itineraryId: string | null;
  media: MediaItem[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const ok = window.confirm(
      "Delete this post? Its photos and itinerary will be removed too. This can't be undone."
    );
    if (!ok) return;

    setError(null);
    setBusy(true);
    const supabase = createClient();
    try {
      const { error: delErr } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);
      if (delErr) throw delErr;

      // The itinerary was created with this post, so it goes too.
      if (itineraryId) {
        await supabase.from("itineraries").delete().eq("id", itineraryId);
      }

      // Free up the stored photos.
      const paths = media
        .map((m) => m.url.split("/post-media/")[1])
        .filter(Boolean);
      if (paths.length) {
        await supabase.storage.from("post-media").remove(paths);
      }

      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the post."
      );
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleDelete}
        disabled={busy}
        className="self-start text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
        {busy ? "Deleting…" : "Delete post"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
