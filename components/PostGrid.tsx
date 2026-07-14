import Link from "next/link";
import type { Post } from "@/lib/types";

// The Instagram-style 3-column grid of a user's posts (first photo = thumbnail).
export function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((p) => {
        const thumb = p.media?.[0]?.url ?? null;
        return (
          <Link
            key={p.id}
            href={`/post/${p.id}`}
            className="relative aspect-square overflow-hidden bg-muted"
          >
            {thumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            )}
            {p.media.length > 1 && (
              <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {p.media.length}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
