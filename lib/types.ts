export type IdReviewStatus = "none" | "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  display_name: string | null;
  age: number | null;
  home_base: string | null;
  bio: string | null;
  travel_interests: string[];
  budget_level: string | null;
  trip_styles: string[];
  profile_photos: string[];
  created_at: string;
  updated_at: string;
};

export type MediaItem = { type: "photo" | "reel"; url: string };

export type Itinerary = {
  id: string;
  title: string | null;
  destinations: string[];
  days: number | null;
  interest_tags: string[];
  budget_level: string | null;
  source: "ai_generated" | "founder_curated" | "user_created";
  created_by_user_id: string | null;
  created_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  caption: string | null;
  destination: string | null;
  media: MediaItem[];
  itinerary_id: string | null;
  created_at: string;
};

export type Verification = {
  user_id: string;
  id_review_status: IdReviewStatus;
  id_selfie_path: string | null;
  id_document_path: string | null;
  linkedin_url: string | null;
  instagram_handle: string | null;
  phone_verified: boolean;
  verified_badge: boolean;
};
