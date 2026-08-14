-- ClosetKeeper: miscellaneous extras cards (sandals, caps, bags, etc.)
-- Run this in Supabase → SQL Editor after schema.sql / schema-outfits-capsules.sql

create table if not exists public.misc_cards (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  cover_image_url text not null default '',
  notes text not null default '',
  pieces jsonb not null default '[]'::jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create index if not exists misc_cards_user_id_idx
  on public.misc_cards (user_id);

create index if not exists misc_cards_updated_date_idx
  on public.misc_cards (user_id, updated_date desc);

alter table public.misc_cards enable row level security;

drop policy if exists "Users can read own misc cards" on public.misc_cards;
create policy "Users can read own misc cards"
  on public.misc_cards
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own misc cards" on public.misc_cards;
create policy "Users can insert own misc cards"
  on public.misc_cards
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own misc cards" on public.misc_cards;
create policy "Users can update own misc cards"
  on public.misc_cards
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own misc cards" on public.misc_cards;
create policy "Users can delete own misc cards"
  on public.misc_cards
  for delete
  using (auth.uid() = user_id);
