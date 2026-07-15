import Link from "next/link";
import { MapPin, Route } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { MediaItem } from "@/lib/types";

export type PostCardData = {
  id: string;
  caption: string | null;
  destination: string | null;
  media: MediaItem[];
  created_at: string;
  author: {
    id: string;
    name: string;
    photo: string | null;
    verified: boolean;
  };
  itinerary: {
    title: string | null;
    destinations: string[];
    days: number | null;
  } | null;
};

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 p-3">
        <Link href={`/profile/${post.author.id}`}>
          <Avatar
            src={post.author.photo}
            name={post.author.name}
            className="w-9 text-sm"
          />
        </Link>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/profile/${post.author.id}`}
              className="text-sm font-semibold hover:underline"
            >
              {post.author.name}
            </Link>
            {post.author.verified && <VerifiedBadge />}
          </div>
          {post.destination && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {post.destination}
            </span>
          )}
        </div>
      </div>

      {/* Media carousel — swipe sideways for more photos */}
      <div className="flex snap-x snap-mandatory overflow-x-auto bg-muted">
        {post.media.map((m, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={m.url}
            alt=""
            className="aspect-square w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      <div className="flex flex-col gap-2 p-3">
        {post.caption && (
          <p className="whitespace-pre-line text-sm">{post.caption}</p>
        )}
        {post.itinerary && post.itinerary.destinations.length > 0 && (
          <Link
            href="/itineraries"
            className="inline-flex items-center gap-1.5 self-start rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-accent"
          >
            <Route className="h-3.5 w-3.5" />
            {post.itinerary.title || post.itinerary.destinations.join(" → ")}
            {post.itinerary.days ? ` · ${post.itinerary.days}d` : ""}
          </Link>
        )}
      </div>
    </article>
  );
}
