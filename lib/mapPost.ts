import type { MediaItem } from "@/lib/types";
import type { PostCardData } from "@/components/PostCard";

// PostgREST embeds can arrive as an object or a single-item array;
// this normalises a joined post row into what PostCard expects.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function one(rel: any) {
  return Array.isArray(rel) ? rel[0] : rel;
}

export function toPostCard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any,
  verified: boolean
): PostCardData {
  const author = one(row.author);
  const itinerary = one(row.itinerary);
  return {
    id: row.id,
    caption: row.caption ?? null,
    destination: row.destination ?? null,
    media: (row.media ?? []) as MediaItem[],
    created_at: row.created_at,
    author: {
      id: row.author_id,
      name: author?.display_name || "Traveler",
      photo: author?.profile_photos?.[0] ?? null,
      verified,
    },
    itinerary: itinerary
      ? {
          title: itinerary.title ?? null,
          destinations: itinerary.destinations ?? [],
          days: itinerary.days ?? null,
        }
      : null,
  };
}
