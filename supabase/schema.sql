-- ============================================================
-- Serai — Sprint 2: Profiles & Trust
-- Run this whole script in Supabase → SQL Editor → New query → Run.
-- It is safe to run more than once.
-- ============================================================

-- 1) PROFILES TABLE ------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  age integer check (age is null or (age >= 18 and age <= 120)),
  home_base text,
  bio text,
  travel_interests text[] not null default '{}',
  budget_level text check (
    budget_level in ('shoestring','budget','comfort','luxury')
  ),
  trip_styles text[] not null default '{}',
  profile_photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) VERIFICATIONS TABLE -------------------------------------------
create table if not exists public.verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  id_review_status text not null default 'none' check (
    id_review_status in ('none','pending','approved','rejected')
  ),
  id_selfie_path text,
  id_document_path text,
  linkedin_url text,
  instagram_handle text,
  phone_verified boolean not null default false,
  -- verified_badge is automatically true once you approve the ID review:
  verified_badge boolean generated always as (id_review_status = 'approved') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) AUTO-CREATE a profile + verification row for each new signup --
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.verifications (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill rows for anyone who signed up before this script:
insert into public.profiles (id)
  select id from auth.users on conflict do nothing;
insert into public.verifications (user_id)
  select id from auth.users on conflict do nothing;

-- 4) SECURITY RULES (Row Level Security) ---------------------------
alter table public.profiles enable row level security;
alter table public.verifications enable row level security;

drop policy if exists "profiles readable by authenticated" on public.profiles;
create policy "profiles readable by authenticated"
  on public.profiles for select to authenticated using (true);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "verifications readable by authenticated" on public.verifications;
create policy "verifications readable by authenticated"
  on public.verifications for select to authenticated using (true);

drop policy if exists "insert own verification" on public.verifications;
create policy "insert own verification"
  on public.verifications for insert to authenticated with check (auth.uid() = user_id);

-- Users may edit their own verification row (docs, links, set to 'pending').
drop policy if exists "update own verification" on public.verifications;
create policy "update own verification"
  on public.verifications for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ...but they cannot APPROVE or REJECT their own ID — only staff (the founder,
-- via the Supabase dashboard) can do that. This trigger enforces it.
create or replace function public.guard_verification_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.id_review_status is distinct from old.id_review_status
     and new.id_review_status in ('approved','rejected')
     and coalesce(auth.role(), '') = 'authenticated' then
    raise exception 'Only staff can approve or reject a verification';
  end if;
  return new;
end; $$;

drop trigger if exists guard_verification_status on public.verifications;
create trigger guard_verification_status
  before update on public.verifications
  for each row execute function public.guard_verification_status();

-- 5) FILE STORAGE --------------------------------------------------
-- profile-photos: public (anyone can view a profile photo)
insert into storage.buckets (id, name, public)
  values ('profile-photos','profile-photos', true)
  on conflict (id) do nothing;

-- id-documents: PRIVATE (only the owner + you, via the dashboard)
insert into storage.buckets (id, name, public)
  values ('id-documents','id-documents', false)
  on conflict (id) do nothing;

-- Profile photo rules (files live in a folder named after the user's id)
drop policy if exists "public read profile photos" on storage.objects;
create policy "public read profile photos"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

drop policy if exists "upload own profile photos" on storage.objects;
create policy "upload own profile photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "update own profile photos" on storage.objects;
create policy "update own profile photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "delete own profile photos" on storage.objects;
create policy "delete own profile photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ID document rules (private: only the owner can read/upload their own)
drop policy if exists "read own id documents" on storage.objects;
create policy "read own id documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'id-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "upload own id documents" on storage.objects;
create policy "upload own id documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'id-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
