"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Clock, ShieldCheck, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Verification } from "@/lib/types";
import { CameraCapture } from "@/components/CameraCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TrustSection({
  verification,
  userId,
}: {
  verification: Verification;
  userId: string;
}) {
  const router = useRouter();
  const status = verification.id_review_status;

  const [selfie, setSelfie] = useState<File | null>(null);
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [linkedin, setLinkedin] = useState(verification.linkedin_url ?? "");
  const [instagram, setInstagram] = useState(
    verification.instagram_handle ?? ""
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function submitVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!selfie || !idDoc) {
      setError("Please add both a selfie and a photo of your ID.");
      return;
    }
    setError(null);
    setBusy(true);
    const supabase = createClient();
    try {
      const upload = async (file: File, kind: string) => {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/${kind}-${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("id-documents")
          .upload(path, file, { upsert: true });
        if (error) throw error;
        return path;
      };
      const selfiePath = await upload(selfie, "selfie");
      const idPath = await upload(idDoc, "id");
      const { error } = await supabase
        .from("verifications")
        .update({
          id_selfie_path: selfiePath,
          id_document_path: idPath,
          id_review_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (error) throw error;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setBusy(false);
    }
  }

  async function saveLinks(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNote(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("verifications")
      .update({
        linkedin_url: linkedin.trim() || null,
        instagram_handle: instagram.trim().replace(/^@/, "") || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    setBusy(false);
    if (error) {
      setError(error.message);
    } else {
      setNote("Saved.");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Trust &amp; verification</CardTitle>
        <CardDescription>
          A verified badge helps others trust you enough to travel together.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Verification status */}
        {status === "approved" && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm font-medium text-primary">
            <BadgeCheck className="h-5 w-5" />
            You&apos;re verified.
          </div>
        )}

        {status === "pending" && (
          <div className="flex items-center gap-2 rounded-lg bg-secondary p-3 text-sm font-medium text-secondary-foreground">
            <Clock className="h-5 w-5" />
            Your ID is under review — we&apos;ll approve it shortly.
          </div>
        )}

        {(status === "none" || status === "rejected") && (
          <form onSubmit={submitVerification} className="flex flex-col gap-3">
            {status === "rejected" && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                <XCircle className="h-5 w-5" />
                Your last submission was declined. Please try again.
              </div>
            )}
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Take a live selfie and add a photo of your ID. These are private
                — only the Serai team can see them.
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Live selfie {selfie && <span className="text-primary">✓</span>}</Label>
              <CameraCapture onCapture={setSelfie} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="iddoc">Photo of your ID</Label>
              <input
                id="iddoc"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setIdDoc(e.target.files?.[0] ?? null)}
                className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-secondary-foreground"
              />
            </div>
            <Button type="submit" disabled={busy} className="mt-1 self-start">
              {busy ? "Submitting…" : "Submit for verification"}
            </Button>
          </form>
        )}

        {/* Booster links */}
        <form onSubmit={saveLinks} className="flex flex-col gap-3 border-t border-border pt-5">
          <p className="text-sm font-semibold">Optional links (build trust)</p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input
              id="linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/you"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="instagram">Instagram handle</Label>
            <Input
              id="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@yourhandle"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={busy}
            className="mt-1 self-start"
          >
            {busy ? "Saving…" : "Save links"}
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {note && <p className="text-sm text-success">{note}</p>}
      </CardContent>
    </Card>
  );
}
