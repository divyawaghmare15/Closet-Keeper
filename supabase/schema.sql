-- ClosetKeeper step 1: clothing items + image storage
-- Run this entire file in Supabase → SQL Editor → New query → Run

-- 1) Wardrobe items table
create table if not exists public.clothing_items (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  image_url text not null,
  category text not null,
  occasions text[] not null default '{}',
  color text not null,
  is_clean boolean not null default true,
  last_worn_date timestamptz,
  created_at timestamptz not null default now(),
  brand text not null default '',
  size text not null default '',
  season text not null default 'All-Season',
  price numeric,
  notes text not null default ''
);

create index if not exists clothing_items_user_id_idx
  on public.clothing_items (user_id);

create index if not exists clothing_items_created_at_idx
  on public.clothing_items (user_id, created_at desc);

-- 2) Row Level Security: each user only sees their own rows
alter table public.clothing_items enable row level security;

drop policy if exists "Users can read own clothing items" on public.clothing_items;
create policy "Users can read own clothing items"
  on public.clothing_items
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own clothing items" on public.clothing_items;
create policy "Users can insert own clothing items"
  on public.clothing_items
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own clothing items" on public.clothing_items;
create policy "Users can update own clothing items"
  on public.clothing_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own clothing items" on public.clothing_items;
create policy "Users can delete own clothing items"
  on public.clothing_items
  for delete
  using (auth.uid() = user_id);

-- 3) Image storage bucket
insert into storage.buckets (id, name, public)
values ('clothing-images', 'clothing-images', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload own clothing images" on storage.objects;
create policy "Users can upload own clothing images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'clothing-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own clothing images" on storage.objects;
create policy "Users can update own clothing images"
  on storage.objects
  for update
  using (
    bucket_id = 'clothing-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own clothing images" on storage.objects;
create policy "Users can delete own clothing images"
  on storage.objects
  for delete
  using (
    bucket_id = 'clothing-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Public can read clothing images" on storage.objects;
create policy "Public can read clothing images"
  on storage.objects
  for select
  using (bucket_id = 'clothing-images');

-- NOTE: For existing projects that already ran step 1, also run:
--   supabase/schema-outfits-capsules.sql
-- The statements below are included so a fresh install gets everything.
-- ClosetKeeper step 2: saved outfits + capsules
-- Run this in Supabase → SQL Editor (safe to run even if step 1 already ran)

-- Saved outfits
create table if not exists public.saved_outfits (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  occasion text not null,
  item_ids text[] not null default '{}',
  items_snapshot jsonb not null default '[]'::jsonb,
  is_favorite boolean not null default true,
  match_score numeric,
  created_date timestamptz not null default now()
);

create index if not exists saved_outfits_user_id_idx
  on public.saved_outfits (user_id);

create index if not exists saved_outfits_created_date_idx
  on public.saved_outfits (user_id, created_date desc);

alter table public.saved_outfits enable row level security;

drop policy if exists "Users can read own saved outfits" on public.saved_outfits;
create policy "Users can read own saved outfits"
  on public.saved_outfits
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved outfits" on public.saved_outfits;
create policy "Users can insert own saved outfits"
  on public.saved_outfits
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own saved outfits" on public.saved_outfits;
create policy "Users can update own saved outfits"
  on public.saved_outfits
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved outfits" on public.saved_outfits;
create policy "Users can delete own saved outfits"
  on public.saved_outfits
  for delete
  using (auth.uid() = user_id);

-- Capsules
create table if not exists public.capsules (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  occasions text[] not null default '{}',
  season text not null default 'All-Season',
  item_ids text[] not null default '{}',
  target_count integer not null default 8,
  notes text not null default '',
  created_date timestamptz not null default now()
);

create index if not exists capsules_user_id_idx
  on public.capsules (user_id);

create index if not exists capsules_created_date_idx
  on public.capsules (user_id, created_date desc);

alter table public.capsules enable row level security;

drop policy if exists "Users can read own capsules" on public.capsules;
create policy "Users can read own capsules"
  on public.capsules
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own capsules" on public.capsules;
create policy "Users can insert own capsules"
  on public.capsules
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own capsules" on public.capsules;
create policy "Users can update own capsules"
  on public.capsules
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own capsules" on public.capsules;
create policy "Users can delete own capsules"
  on public.capsules
  for delete
  using (auth.uid() = user_id);
