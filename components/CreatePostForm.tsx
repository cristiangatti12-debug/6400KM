"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MediaItem } from "@/lib/types";
import { TRAVEL_INTERESTS, BUDGET_LEVELS } from "@/lib/profileOptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { TagSelect } from "@/components/TagSelect";

const MAX_PHOTOS = 8;

export function CreatePostForm({ userId }: { userId: string }) {
  const router = useRouter();

  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [destination, setDestination] = useState("");

  // Itinerary
  const [itTitle, setItTitle] = useState("");
  const [stops, setStops] = useState<string[]>([""]);
  const [days, setDays] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
    e.target.value = "";
  }
  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  function setStop(i: number, val: string) {
    setStops((prev) => prev.map((s, idx) => (idx === i ? val : s)));
  }
  function addStop() {
    setStops((prev) => [...prev, ""]);
  }
  function removeStop(i: number) {
    setStops((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanStops = stops.map((s) => s.trim()).filter(Boolean);
    if (files.length === 0) {
      setError("Add at least one photo.");
      return;
    }
    if (cleanStops.length === 0) {
      setError("Add at least one stop for the itinerary.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    try {
      // 1) Upload photos
      const media: MediaItem[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("post-media")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage
          .from("post-media")
          .getPublicUrl(path);
        media.push({ type: "photo", url: data.publicUrl });
      }

      // 2) Create the itinerary
      const { data: itinerary, error: itErr } = await supabase
        .from("itineraries")
        .insert({
          title: itTitle.trim() || cleanStops.join(" → "),
          destinations: cleanStops,
          days: days ? Number(days) : null,
          interest_tags: interests,
          budget_level: budget || null,
          source: "user_created",
          created_by_user_id: userId,
        })
        .select("id")
        .single();
      if (itErr) throw itErr;

      // 3) Create the post
      const { error: postErr } = await supabase.from("posts").insert({
        author_id: userId,
        caption: caption.trim() || null,
        destination: destination.trim() || cleanStops[0],
        media,
        itinerary_id: itinerary.id,
      });
      if (postErr) throw postErr;

      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handlePublish} className="flex flex-col gap-6">
      {/* Photos */}
      <section className="flex flex-col gap-3">
        <Label>Photos</Label>
        <div className="grid grid-cols-3 gap-3">
          {files.map((file, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-xl bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label="Remove photo"
                className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {files.length < MAX_PHOTOS && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary">
              <Plus className="h-6 w-6" />
              <span className="text-xs font-medium">Add</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={pickFiles}
              />
            </label>
          )}
        </div>
      </section>

      {/* Caption */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="caption">Caption</Label>
        <Textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Tell the story of this trip…"
          maxLength={2000}
        />
      </div>

      {/* Itinerary block */}
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <div>
          <h2 className="text-sm font-bold">Itinerary</h2>
          <p className="text-xs text-muted-foreground">
            This is what shows up on the Itineraries page.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="itTitle">Title</Label>
          <Input
            id="itTitle"
            value={itTitle}
            onChange={(e) => setItTitle(e.target.value)}
            placeholder="e.g. A long weekend in Lisbon"
            maxLength={120}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Stops (in order)</Label>
          {stops.map((stop, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={stop}
                onChange={(e) => setStop(i, e.target.value)}
                placeholder={`Stop ${i + 1}`}
                maxLength={80}
              />
              {stops.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStop(i)}
                  aria-label="Remove stop"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addStop}
            className="self-start"
          >
            <Plus className="h-4 w-4" />
            Add stop
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="days">Days</Label>
            <Input
              id="days"
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="3"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="budget">Budget</Label>
            <Select
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            >
              <option value="">—</option>
              {BUDGET_LEVELS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Themes</Label>
          <TagSelect
            options={TRAVEL_INTERESTS}
            value={interests}
            onChange={setInterests}
          />
        </div>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" disabled={saving}>
        {saving ? "Publishing…" : "Publish post"}
      </Button>
    </form>
  );
}
