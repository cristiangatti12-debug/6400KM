-- ============================================================
-- Serai — Posts & Itineraries (safe to run more than once)
-- Run in Supabase → SQL Editor → New query → Run.
-- ============================================================

-- ITINERARIES (each post can carry one; also used by the Itineraries page)
create table if not exists public.itineraries (
  id uuid primary key default gen_random_uuid(),
  title text,
  destinations text[] not null default '{}',   -- ordered stops (names)
  stop_points jsonb not null default '[]',     -- [{name,lat,lng}] for the map
  days integer check (days is null or (days >= 1 and days <= 365)),
  interest_tags text[] not null default '{}',
  budget_level text check (
    budget_level in ('shoestring','budget','comfort','luxury')
  ),
  source text not null default 'user_created' check (
    source in ('ai_generated','founder_curated','user_created')
  ),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- For databases created before maps existed:
alter table public.itineraries
  add column if not exists stop_points jsonb not null default '[]';

-- POSTS (photos now, reels later; media is a list of {type,url})
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  caption text,
  destination text,
  media jsonb not null default '[]',
  itinerary_id uuid references public.itineraries(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists posts_author_created_idx
  on public.posts (author_id, created_at desc);
create index if not exists posts_created_idx
  on public.posts (created_at desc);

alter table public.itineraries enable row level security;
alter table public.posts enable row level security;

-- Everyone signed in can read posts & itineraries; you only write your own.
drop policy if exists "itineraries readable" on public.itineraries;
create policy "itineraries readable" on public.itineraries
  for select to authenticated using (true);
drop policy if exists "insert own itinerary" on public.itineraries;
create policy "insert own itinerary" on public.itineraries
  for insert to authenticated with check (created_by_user_id = auth.uid());
drop policy if exists "update own itinerary" on public.itineraries;
create policy "update own itinerary" on public.itineraries
  for update to authenticated
  using (created_by_user_id = auth.uid())
  with check (created_by_user_id = auth.uid());
drop policy if exists "delete own itinerary" on public.itineraries;
create policy "delete own itinerary" on public.itineraries
  for delete to authenticated using (created_by_user_id = auth.uid());

drop policy if exists "posts readable" on public.posts;
create policy "posts readable" on public.posts
  for select to authenticated using (true);
drop policy if exists "insert own post" on public.posts;
create policy "insert own post" on public.posts
  for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "update own post" on public.posts;
create policy "update own post" on public.posts
  for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists "delete own post" on public.posts;
create policy "delete own post" on public.posts
  for delete to authenticated using (author_id = auth.uid());

-- Post media storage (public bucket; will also hold reels later)
insert into storage.buckets (id, name, public)
  values ('post-media','post-media', true) on conflict (id) do nothing;

drop policy if exists "public read post media" on storage.objects;
create policy "public read post media" on storage.objects
  for select using (bucket_id = 'post-media');
drop policy if exists "upload own post media" on storage.objects;
create policy "upload own post media" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "delete own post media" on storage.objects;
create policy "delete own post media" on storage.objects
  for delete to authenticated using (
    bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text
  );
