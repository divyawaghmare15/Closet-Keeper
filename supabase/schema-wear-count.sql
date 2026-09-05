-- Optional: wear count for cost-per-wear (existing projects)
-- Run in Supabase → SQL Editor if clothing_items already exists

alter table public.clothing_items
  add column if not exists wear_count integer not null default 0;
