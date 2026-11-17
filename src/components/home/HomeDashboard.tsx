'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { WeatherChip } from '@/components/common/WeatherChip';
import { useAuth } from '@/context/AuthContext';
import { useWardrobe } from '@/context/WardrobeContext';
import {
  isBottomCategory,
  isLayerCategory,
  isOnePieceCategory,
  isTopCategory,
} from '@/lib/constants';
import type { ClothingItem, Occasion } from '@/types';

const QUICK_OCCASIONS: Occasion[] = [
  'Casual',
  'Office',
  'Formal',
  'Festive',
  'Party',
  'Travel',
];

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function firstNameFromEmail(email: string | undefined): string | null {
  if (!email) return null;
  const local = email.split('@')[0] ?? '';
  const token = local.split(/[._-]/)[0] ?? '';
  if (!token) return null;
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function daysSinceWorn(item: ClothingItem): number {
  if (!item.lastWornDate) return Number.POSITIVE_INFINITY;
  const worn = new Date(item.lastWornDate);
  if (Number.isNaN(worn.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - worn.getTime()) / (1000 * 60 * 60 * 24));
}

function formatIdleLabel(item: ClothingItem): string {
  const days = daysSinceWorn(item);
  if (!Number.isFinite(days)) return 'Never worn';
  if (days >= 30) return `${days}d idle`;
  if (days === 0) return 'Worn today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

function pickFeaturedPairs(cleanItems: ClothingItem[]): ClothingItem[][] {
  const pairs: ClothingItem[][] = [];
  const used = new Set<string>();

  const take = (items: ClothingItem[]) => {
    const next = items.find((item) => !used.has(item.id));
    if (!next) return null;
    used.add(next.id);
    return next;
  };

  const onePieces = cleanItems.filter((item) =>
    isOnePieceCategory(item.category),
  );
  const tops = cleanItems.filter((item) => isTopCategory(item.category));
  const bottoms = cleanItems.filter((item) => isBottomCategory(item.category));
  const layers = cleanItems.filter((item) => isLayerCategory(item.category));

  for (const onePiece of onePieces) {
    if (used.has(onePiece.id)) continue;
    used.add(onePiece.id);
    const layer = take(layers);
    pairs.push(layer ? [onePiece, layer] : [onePiece]);
    if (pairs.length >= 4) return pairs;
  }

  for (const top of tops) {
    if (used.has(top.id)) continue;
    const bottom = take(bottoms);
    if (!bottom) break;
    used.add(top.id);
    pairs.push([top, bottom]);
    if (pairs.length >= 4) return pairs;
  }

  if (pairs.length === 0) {
    const leftovers = cleanItems.slice(0, 2);
    if (leftovers.length > 0) pairs.push(leftovers);
  }

  return pairs;
}

export function HomeDashboard() {
  const { user } = useAuth();
  const { items, savedOutfits, resolveOutfit } = useWardrobe();
  const [lookIndex, setLookIndex] = useState(0);

  const cleanItems = useMemo(
    () => items.filter((item) => item.isClean),
    [items],
  );
  const laundryCount = items.length - cleanItems.length;
  const featuredLooks = useMemo(
    () => pickFeaturedPairs(cleanItems),
    [cleanItems],
  );
  const featured =
    featuredLooks[
      featuredLooks.length === 0 ? 0 : lookIndex % featuredLooks.length
    ] ?? [];

  const rotateItems = useMemo(
    () =>
      [...cleanItems]
        .sort((a, b) => daysSinceWorn(b) - daysSinceWorn(a))
        .slice(0, 10),
    [cleanItems],
  );

  const recentOutfits = useMemo(
    () => savedOutfits.slice(0, 4).map(resolveOutfit),
    [savedOutfits, resolveOutfit],
  );

  const isEmpty = items.length === 0;
  const canBuildOutfit = items.length >= 2;
  const name = firstNameFromEmail(user?.email);
  const greeting = timeGreeting();

  if (isEmpty) {
    return <EmptyHome greeting={greeting} name={name} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-3 pb-2 pt-4 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">
      {/* First viewport: greeting + one look + one CTA */}
      <section className="animate-fade-up">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
              ClosetKeeper
            </p>
            <h1 className="mt-1 font-display text-[1.65rem] leading-tight font-semibold tracking-tight text-foreground sm:text-4xl">
              {greeting}
              {name ? `, ${name}` : ''}
            </h1>
            <p className="mt-1.5 text-sm text-muted sm:text-base">
              One calm look to start the day.
            </p>
          </div>
        </div>

        <div className="mt-3 sm:mt-4">
          <WeatherChip variant="compact" />
        </div>
      </section>

      <section
        className="animate-fade-up mt-5 sm:mt-8"
        style={{ animationDelay: '80ms' }}
      >
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight sm:text-2xl">
              Today&apos;s look
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              {cleanItems.length} clean · tap Shuffle for another pairing
            </p>
          </div>
          {featuredLooks.length > 1 ? (
            <button
              type="button"
              onClick={() => setLookIndex((i) => i + 1)}
              className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-accent transition hover:bg-accent-soft/70 active:scale-[0.98]"
            >
              Shuffle
            </button>
          ) : null}
        </div>

        <TodayLookStage
          featured={featured}
          canBuildOutfit={canBuildOutfit}
        />
      </section>

      {/* Occasion shortcuts — second job: dress for X */}
      <section
        className="animate-fade-up mt-7 sm:mt-10"
        style={{ animationDelay: '140ms' }}
      >
        <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
          Dress for
        </h2>
        <p className="mt-0.5 text-xs text-muted sm:text-sm">
          Jump straight into a look for the moment.
        </p>
        <div className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          {QUICK_OCCASIONS.map((occasion) => (
            <Link
              key={occasion}
              href={`/generator?occasion=${encodeURIComponent(occasion)}`}
              className="shrink-0 rounded-2xl border border-border/70 bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/35 hover:bg-accent-soft/50 active:scale-[0.98]"
            >
              {occasion}
            </Link>
          ))}
        </div>
      </section>

      {/* Closet pulse — scannable status, not a dashboard dump */}
      <section
        className="animate-fade-up mt-7 sm:mt-10"
        style={{ animationDelay: '180ms' }}
      >
        <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
          Closet pulse
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          <PulseTile
            href="/wardrobe"
            value={cleanItems.length}
            label="Ready"
            tone="accent"
          />
          <PulseTile
            href="/wardrobe?laundry=1"
            value={laundryCount}
            label="Laundry"
            tone="wash"
          />
          <PulseTile
            href="/wardrobe"
            value={items.length}
            label="All"
            tone="neutral"
          />
        </div>
      </section>

      {/* Unworn spotlight */}
      {rotateItems.length > 0 ? (
        <section
          className="animate-fade-up mt-7 sm:mt-10"
          style={{ animationDelay: '220ms' }}
        >
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                Wear these more
              </h2>
              <p className="text-xs text-muted sm:text-sm">
                Quiet pieces waiting for another turn.
              </p>
            </div>
            <Link
              href="/wardrobe"
              className="shrink-0 text-sm font-semibold text-accent"
            >
              Closet
            </Link>
          </div>
          <div className="-mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {rotateItems.map((item) => (
              <Link
                key={item.id}
                href="/wardrobe"
                className="w-[7.25rem] shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-surface-elevated shadow-sm transition hover:border-accent/30 active:scale-[0.98] sm:w-32"
              >
                <div className="relative aspect-[3/4] bg-accent-soft/35">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-0.5 p-2">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="truncate text-[10px] text-muted">
                    {formatIdleLabel(item)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {recentOutfits.length > 0 ? (
        <section
          className="animate-fade-up mt-7 sm:mt-10"
          style={{ animationDelay: '260ms' }}
        >
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                Saved looks
              </h2>
              <p className="text-xs text-muted sm:text-sm">
                Rewear a combo you already liked.
              </p>
            </div>
            <Link
              href="/generator"
              className="shrink-0 text-sm font-semibold text-accent"
            >
              All looks
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {recentOutfits.map((outfit) => {
              const preview = outfit.items.slice(0, 2);
              return (
                <Link
                  key={outfit.id}
                  href="/generator"
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface-elevated p-2.5 shadow-sm transition hover:border-accent/30 active:scale-[0.99]"
                >
                  <div className="flex -space-x-3">
                    {preview.map((item) => (
                      <div
                        key={item.id}
                        className="relative size-12 overflow-hidden rounded-xl border-2 border-surface-elevated bg-accent-soft/40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {outfit.title || 'Saved look'}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {outfit.occasion}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function PulseTile({
  href,
  value,
  label,
  tone,
}: {
  href: string;
  value: number;
  label: string;
  tone: 'accent' | 'wash' | 'neutral';
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border/60 bg-surface-elevated p-3 shadow-sm transition hover:border-accent/30 active:scale-[0.98] sm:p-4"
    >
      <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        <span
          className={
            tone === 'accent'
              ? 'text-accent'
              : tone === 'wash'
                ? 'text-wash'
                : 'text-foreground'
          }
        >
          {value}
        </span>
      </p>
      <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-muted uppercase sm:text-xs">
        {label}
      </p>
    </Link>
  );
}

function TodayLookStage({
  featured,
  canBuildOutfit,
}: {
  featured: ClothingItem[];
  canBuildOutfit: boolean;
}) {
  if (featured.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-border/70 bg-surface-elevated px-5 py-10 text-center shadow-sm">
        <p className="font-display text-xl font-semibold">Nothing clean yet</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Mark a few pieces as clean and today&apos;s look will appear here.
        </p>
        <Link
          href="/wardrobe?laundry=1"
          className="mt-5 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
        >
          Open laundry
        </Link>
      </div>
    );
  }

  const isPair = featured.length > 1;

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-surface-elevated shadow-[0_18px_40px_-28px_rgba(45,38,64,0.35)]">
      <div
        className={
          isPair
            ? 'grid grid-cols-2'
            : 'flex items-center justify-center bg-accent-soft/25'
        }
      >
        {featured.map((item, index) => (
          <div
            key={item.id}
            className={`relative overflow-hidden ${
              isPair
                ? 'h-[min(280px,42svh)] bg-accent-soft/30 sm:h-[min(360px,46svh)]'
                : 'h-[min(320px,46svh)] w-full sm:h-[min(400px,50svh)]'
            } ${index === 1 ? 'border-l border-border/40' : ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-50"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.title}
              className="relative z-10 mx-auto h-full w-full object-contain object-center p-2 sm:p-3"
            />
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-foreground/60 via-foreground/25 to-transparent px-2.5 pb-2.5 pt-10 sm:px-3 sm:pb-3">
              <p className="truncate text-xs font-semibold text-white sm:text-sm">
                {item.title}
              </p>
              <p className="truncate text-[10px] text-white/80 sm:text-xs">
                {item.category} · {item.color}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Ready to wear
          </p>
          <p className="text-xs text-muted">
            {featured.map((item) => item.title).join(' · ')}
          </p>
        </div>
        {canBuildOutfit ? (
          <Link
            href="/generator?occasion=Casual"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] sm:w-auto"
          >
            Build this look
          </Link>
        ) : (
          <Link
            href="/add-item"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] sm:w-auto"
          >
            Add another piece
          </Link>
        )}
      </div>
    </div>
  );
}

function EmptyHome({
  greeting,
  name,
}: {
  greeting: string;
  name: string | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-8 sm:px-6 sm:py-14">
      <div className="animate-fade-up text-center">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
          ClosetKeeper
        </p>
        <h1 className="mt-3 font-display text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl">
          {greeting}
          {name ? `, ${name}` : ''}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-muted">
          Digitize your closet once. Every morning gets a calmer answer to
          &ldquo;what should I wear?&rdquo;
        </p>
      </div>

      <div
        className="animate-fade-up mt-8 overflow-hidden rounded-[1.75rem] border border-dashed border-accent/35 bg-surface-elevated/90 px-6 py-10 text-center shadow-sm"
        style={{ animationDelay: '100ms' }}
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <HangerIcon />
        </div>
        <p className="mt-5 font-display text-xl font-semibold text-foreground">
          Your stage is empty
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
          Start with 5–10 everyday pieces. Suggestions get better as your
          closet grows.
        </p>
        <Link
          href="/add-item"
          className="mt-6 inline-flex rounded-2xl bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
        >
          Add your first piece
        </Link>
      </div>

      <ul
        className="animate-fade-up mt-8 space-y-3"
        style={{ animationDelay: '180ms' }}
      >
        {[
          'Snap a photo — tags fill in for you',
          'See what is clean vs in laundry',
          'Get top + bottom looks by occasion',
        ].map((line) => (
          <li
            key={line}
            className="flex items-start gap-3 rounded-2xl border border-border/50 bg-surface-elevated/70 px-4 py-3 text-sm text-foreground"
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HangerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden
    >
      <path d="M12 3a2 2 0 0 1 2 2v1.5" />
      <path d="M6.5 9.5 12 6l5.5 3.5" />
      <path d="M4 20h16L12 9 4 20z" />
    </svg>
  );
}
