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
