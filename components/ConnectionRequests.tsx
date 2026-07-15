"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";

export type RequestItem = {
  connectionId: string;
  userId: string;
  name: string;
  photo: string | null;
  verified: boolean;
};

export function ConnectionRequests({ requests }: { requests: RequestItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(requests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function accept(connectionId: string) {
    setBusyId(connectionId);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("id", connectionId);
    setBusyId(null);
    if (error) return setError(error.message);
    setItems((prev) => prev.filter((i) => i.connectionId !== connectionId));
    router.refresh();
  }

  async function decline(connectionId: string) {
    setBusyId(connectionId);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId);
    setBusyId(null);
    if (error) return setError(error.message);
    setItems((prev) => prev.filter((i) => i.connectionId !== connectionId));
    router.refresh();
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {items.map((r) => (
        <div
          key={r.connectionId}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
        >
          <Link href={`/profile/${r.userId}`}>
            <Avatar src={r.photo} name={r.name} className="w-11" />
          </Link>
          <Link
            href={`/profile/${r.userId}`}
            className="flex flex-1 items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            {r.name}
            {r.verified && <VerifiedBadge />}
          </Link>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              onClick={() => accept(r.connectionId)}
              disabled={busyId === r.connectionId}
            >
              <Check className="h-4 w-4" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => decline(r.connectionId)}
              disabled={busyId === r.connectionId}
              aria-label="Decline"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
