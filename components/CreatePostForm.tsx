"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, MapPin, Loader2, Check, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import type { MediaItem } from "@/lib/types";
import { TRAVEL_INTERESTS, BUDGET_LEVELS } from "@/lib/profileOptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { TagSelect } from "@/components/TagSelect";
import { MapPreview } from "@/components/MapPreview";

const MAX_PHOTOS = 8;

type Stop = {
  text: string;
  lat?: number;
  lng?: number;
  label?: string;
  status: "idle" | "loading" | "ok" | "notfound";
};

async function geocode(text: string) {
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(text)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.result as {
      name: string;
      lat: number;
      lng: number;
      label: string;
    } | null;
  } catch {
    return null;
  }
}

export function CreatePostForm({ userId }: { userId: string }) {
  const router = useRouter();

  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [destination, setDestination] = useState("");

  const [itTitle, setItTitle] = useState("");
  const [stops, setStops] = useState<Stop[]>([{ text: "", status: "idle" }]);
  const [days, setDays] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const located = stops
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => ({ name: s.text.trim(), lat: s.lat!, lng: s.lng! }));

  function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
    e.target.value = "";
  }
  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  function setStopText(i: number, val: string) {
    setStops((prev) =>
      prev.map((s, idx) =>
        idx === i
          ? { text: val, status: "idle", lat: undefined, lng: undefined }
          : s
      )
    );
  }

  // Look the place up when the user leaves the field.
  async function locateStop(i: number) {
    const text = stops[i]?.text.trim();
    if (!text || stops[i].status === "ok") return;
    setStops((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, status: "loading" } : s))
    );
    const hit = await geocode(text);
    setStops((prev) =>
      prev.map((s, idx) =>
        idx === i
          ? hit
            ? {
                ...s,
                lat: hit.lat,
                lng: hit.lng,
                label: hit.label,
                status: "ok",
              }
            : { ...s, status: "notfound" }
          : s
      )
    );
  }

  function addStop() {
    setStops((prev) => [...prev, { text: "", status: "idle" }]);
  }
  function removeStop(i: number) {
    setStops((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const clean = stops.filter((s) => s.text.trim());
    if (files.length === 0) {
      setError("Add at least one photo.");
      return;
    }
    if (clean.length === 0) {
      setError("Add at least one stop for the itinerary.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    try {
      // Fill in coordinates for any stop that wasn't looked up yet.
      const resolved = [...clean];
      for (let i = 0; i < resolved.length; i++) {
        if (resolved[i].lat == null && resolved[i].status !== "notfound") {
          const hit = await geocode(resolved[i].text.trim());
          if (hit) resolved[i] = { ...resolved[i], lat: hit.lat, lng: hit.lng };
        }
      }

      // 1) Compress + upload all photos in parallel (keeps their order)
      const media: MediaItem[] = await Promise.all(
        files.map(async (file): Promise<MediaItem> => {
          const compressed = await compressImage(file);
          const path = `${userId}/${crypto.randomUUID()}.jpg`;
          const { error: upErr } = await supabase.storage
            .from("post-media")
            .upload(path, compressed, {
              upsert: false,
              contentType: "image/jpeg",
            });
          if (upErr) throw upErr;
          const { data } = supabase.storage
            .from("post-media")
            .getPublicUrl(path);
          return { type: "photo", url: data.publicUrl };
        })
      );

      const destinations = resolved.map((s) => s.text.trim());
      const stopPoints = resolved
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => ({ name: s.text.trim(), lat: s.lat, lng: s.lng }));

      // 2) Create the itinerary
      const { data: itinerary, error: itErr } = await supabase
        .from("itineraries")
        .insert({
          title: itTitle.trim() || destinations.join(" → "),
          destinations,
          stop_points: stopPoints,
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
        destination: destination.trim() || destinations[0],
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
            Stops are placed on a map — this is what shows on the Itineraries
            page.
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

        <div className="flex flex-col gap-3">
          <Label>Stops (in order)</Label>
          {stops.map((stop, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex gap-2">
                <Input
                  value={stop.text}
                  onChange={(e) => setStopText(i, e.target.value)}
                  onBlur={() => locateStop(i)}
                  placeholder={`Stop ${i + 1} — e.g. Lisbon`}
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
              {stop.status === "loading" && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Finding it on the map…
                </span>
              )}
              {stop.status === "ok" && stop.label && (
                <span className="inline-flex items-center gap-1 text-xs text-primary">
                  <Check className="h-3 w-3" />
                  <span className="truncate">{stop.label}</span>
                </span>
              )}
              {stop.status === "notfound" && (
                <span className="inline-flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  Couldn&apos;t find that place — try a different spelling.
                </span>
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

        {/* Live map preview as stops are added */}
        {located.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Route preview
            </span>
            <MapPreview stops={located} height={200} />
          </div>
        )}

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
