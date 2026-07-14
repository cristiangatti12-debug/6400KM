"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import {
  TRAVEL_INTERESTS,
  TRIP_STYLES,
  BUDGET_LEVELS,
} from "@/lib/profileOptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { TagSelect } from "@/components/TagSelect";

const MAX_PHOTOS = 6;

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [age, setAge] = useState(profile.age ? String(profile.age) : "");
  const [homeBase, setHomeBase] = useState(profile.home_base ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [interests, setInterests] = useState<string[]>(
    profile.travel_interests ?? []
  );
  const [tripStyles, setTripStyles] = useState<string[]>(
    profile.trip_styles ?? []
  );
  const [budget, setBudget] = useState(profile.budget_level ?? "");

  // Existing saved photo URLs + newly picked files (not uploaded yet).
  const [photos, setPhotos] = useState<string[]>(profile.profile_photos ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalPhotos = photos.length + newFiles.length;

  function handlePickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const room = MAX_PHOTOS - totalPhotos;
    setNewFiles((prev) => [...prev, ...picked.slice(0, room)]);
    e.target.value = "";
  }

  function removeExisting(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  function removeNew(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClient();

    try {
      // 1) Upload any newly picked photos to the user's storage folder.
      const uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${profile.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("profile-photos")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }

      const finalPhotos = [...photos, ...uploadedUrls];

      // 2) Save the profile fields.
      const { error: saveErr } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          age: age ? Number(age) : null,
          home_base: homeBase.trim() || null,
          bio: bio.trim() || null,
          travel_interests: interests,
          trip_styles: tripStyles,
          budget_level: budget || null,
          profile_photos: finalPhotos,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (saveErr) throw saveErr;

      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      {/* Photos */}
      <section className="flex flex-col gap-3">
        <Label>Photos</Label>
        <div className="grid grid-cols-3 gap-3">
          {photos.map((url) => (
            <PhotoTile key={url} src={url} onRemove={() => removeExisting(url)} />
          ))}
          {newFiles.map((file, i) => (
            <PhotoTile
              key={`new-${i}`}
              src={URL.createObjectURL(file)}
              onRemove={() => removeNew(i)}
            />
          ))}
          {totalPhotos < MAX_PHOTOS && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
              <Plus className="h-6 w-6" />
              <span className="text-xs font-medium">Add</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePickFiles}
              />
            </label>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Up to {MAX_PHOTOS} photos. The first one is your main picture.
        </p>
      </section>

      {/* Name */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Cristian"
          maxLength={50}
        />
      </div>

      {/* Age + Home base */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            min={18}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="30"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="homeBase">Home base</Label>
          <Input
            id="homeBase"
            value={homeBase}
            onChange={(e) => setHomeBase(e.target.value)}
            placeholder="Luxembourg"
            maxLength={80}
          />
        </div>
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">About you</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A few lines about you and how you like to travel…"
          maxLength={500}
        />
      </div>

      {/* Budget */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="budget">Typical budget</Label>
        <Select
          id="budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        >
          <option value="">No preference</option>
          {BUDGET_LEVELS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Interests */}
      <div className="flex flex-col gap-2">
        <Label>Travel interests</Label>
        <TagSelect
          options={TRAVEL_INTERESTS}
          value={interests}
          onChange={setInterests}
        />
      </div>

      {/* Trip styles */}
      <div className="flex flex-col gap-2">
        <Label>Trip style</Label>
        <TagSelect
          options={TRIP_STYLES}
          value={tripStyles}
          onChange={setTripStyles}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={saving} className="flex-1">
          {saving ? "Saving…" : "Save profile"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/profile")}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function PhotoTile({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
