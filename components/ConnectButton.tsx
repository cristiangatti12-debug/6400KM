"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Clock, Check, MessageCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export type ConnectState = "none" | "outgoing" | "incoming" | "connected";

export function ConnectButton({
  meId,
  otherId,
  initialState,
  connectionId,
}: {
  meId: string;
  otherId: string;
  initialState: ConnectState;
  connectionId: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<ConnectState>(initialState);
  const [connId, setConnId] = useState<string | null>(connectionId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("connections")
      .insert({ requester_id: meId, target_id: otherId, status: "pending" })
      .select("id")
      .single();
    setBusy(false);
    if (error) return setError(error.message);
    setConnId(data.id);
    setState("outgoing");
    router.refresh();
  }

  async function accept() {
    if (!connId) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("id", connId);
    setBusy(false);
    if (error) return setError(error.message);
    setState("connected");
    router.refresh();
  }

  async function remove() {
    if (!connId) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("connections").delete().eq("id", connId);
    setBusy(false);
    if (error) return setError(error.message);
    setConnId(null);
    setState("none");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {state === "none" && (
          <Button onClick={send} disabled={busy}>
            <UserPlus className="h-4 w-4" />
            {busy ? "Sending…" : "Connect"}
          </Button>
        )}

        {state === "outgoing" && (
          <>
            <Button variant="outline" disabled>
              <Clock className="h-4 w-4" />
              Request sent
            </Button>
            <Button variant="ghost" onClick={remove} disabled={busy}>
              Cancel
            </Button>
          </>
        )}

        {state === "incoming" && (
          <>
            <Button onClick={accept} disabled={busy}>
              <Check className="h-4 w-4" />
              {busy ? "Accepting…" : "Accept request"}
            </Button>
            <Button variant="ghost" onClick={remove} disabled={busy}>
              <X className="h-4 w-4" />
              Decline
            </Button>
          </>
        )}

        {state === "connected" && (
          <>
            <Button onClick={() => router.push(`/chat/${otherId}`)}>
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
            <span className="inline-flex items-center gap-1 self-center rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
              <Check className="h-3.5 w-3.5" />
              Connected
            </span>
          </>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
