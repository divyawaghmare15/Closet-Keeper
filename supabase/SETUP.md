# ClosetKeeper — Supabase setup (cloud-complete)

## Already connected?
If you already finished step 1 (items + auth), you only need **Step 2 SQL** below.

## Fresh setup

### 1. Create a Supabase project
1. Go to https://supabase.com and create a free project.
2. Open **Project Settings → API Keys**.
3. Copy **Project URL** and **anon public** key.

### 2. Add env vars
1. Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. Restart `npm run dev`.

### 3. Create all tables + storage
1. Supabase → **SQL Editor** → New query.
2. Paste and run **`supabase/schema.sql`** (items + outfits + capsules + storage).

### 4. Auth settings (recommended for local learning)
1. **Authentication → Providers → Email**
2. Turn **Confirm email** OFF.

### 5. Use the app
1. Open http://localhost:3000/auth and create an account.
2. Add items, save outfits, save capsules — all sync to Supabase.
3. If you still have browser-only data, use the banner **Import to cloud**.

---

## Existing project (you already have clothing_items)

Run only this file in SQL Editor:

**`supabase/schema-outfits-capsules.sql`**

Then refresh the app (signed in) and:
1. Save an outfit from **Outfits → Ideas → Save outfit**
2. Check Table Editor → **`saved_outfits`**
3. Save a capsule from **Capsule**
4. Check Table Editor → **`capsules`**

---

## What syncs to the cloud

| Data | Table / bucket |
|---|---|
| Clothing items | `clothing_items` |
| Photos | Storage bucket `clothing-images` |
| Saved outfits | `saved_outfits` |
| Capsules | `capsules` |
| Login | Supabase Auth |
