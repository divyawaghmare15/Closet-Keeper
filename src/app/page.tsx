'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWardrobe } from '@/context/WardrobeContext';
import type { ClothingItem } from '@/types';

export default function HomePage() {
  const { user, loading: authLoading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && configured && !user) {
      router.replace('/auth');
    }
  }, [authLoading, configured, user, router]);

  if (authLoading || (configured && !user)) {
    return null;
  }

  return <HomeContent />;
}

function HomeContent() {
  const { items, savedOutfits } = useWardrobe();
  const totalItems = items.length;
  const cleanItems = items.filter((item) => item.isClean);
  const featured = pickFeaturedPair(cleanItems);
  const isEmpty = totalItems === 0;
  const canBuildOutfit = totalItems >= 2;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col">
      <section className="relative flex min-h-[calc(100svh-4rem)] flex-col px-4 py-6 sm:px-6 sm:py-8 lg:min-h-[calc(100svh-4rem)] lg:px-10 lg:py-12">
        <div
          aria-hidden
          className="animate-soft-pulse pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(ellipse_at_center,rgba(228,217,245,0.75),transparent_70%)] lg:h-[60%]"
        />

        <div className="relative z-10 grid flex-1 gap-8 lg:mt-4 lg:grid-cols-2 lg:items-center lg:gap-12 xl:gap-16">
          <div className="animate-fade-up flex flex-col justify-center max-w-xl" style={{ animationDelay: '80ms' }}>
            {isEmpty ? (
              <>
                <h1 className="font-display text-3xl leading-tight font-medium tracking-tight text-foreground sm:text-4xl xl:text-5xl">
                  Build your digital wardrobe
                </h1>
                <p className="mt-3 max-w-md text-base leading-relaxed text-muted sm:text-lg">
                  Add your everyday staples to get calm, weather-ready outfit
                  recommendations.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-7 sm:gap-3">
                  <Link
                    href="/add-item"
                    className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] sm:px-6 sm:py-3.5"
                  >
                    + Add your first piece
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="font-display text-3xl leading-tight font-medium tracking-tight text-foreground sm:text-4xl xl:text-5xl">
                  What to wear today
                </h1>
                <p className="mt-3 max-w-md text-base leading-relaxed text-muted sm:text-lg">
                  Start from a calm suggestion, then refine your closet when you
                  need it.
                </p>

                <div className="mt-6 flex flex-wrap items-start gap-2 sm:mt-7 sm:gap-3">
                  {canBuildOutfit ? (
                    <Link
                      href="/generator"
                      className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] sm:px-6 sm:py-3.5"
                    >
                      Build outfit
                    </Link>
                  ) : (
                    <div className="flex w-full flex-col items-start gap-1.5 sm:w-auto">
                      <span
                        aria-disabled="true"
                        className="rounded-2xl bg-accent/40 px-5 py-3 text-sm font-semibold text-white/80 sm:px-6 sm:py-3.5"
                      >
                        Build outfit
                      </span>
                      <p className="text-xs leading-relaxed text-muted">
                        Add at least 2 items to build an outfit
                      </p>
                    </div>
                  )}
                  <Link
                    href="/add-item"
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70 sm:px-5 sm:py-3.5"
                  >
                    Add item
                  </Link>
                  <Link
                    href="/misc"
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70 sm:px-5 sm:py-3.5"
                  >
                    Extras
                  </Link>
                </div>
              </>
            )}

            <StatBadges
              totalItems={totalItems}
              outfitCount={savedOutfits.length}
            />
          </div>

          <div
            className="animate-fade-up flex w-full min-w-0 items-center"
            style={{ animationDelay: '160ms' }}
          >
            {isEmpty ? (
              <EmptyStageDropzone />
            ) : (
              <FeaturedStage
                featured={featured}
                cleanCount={cleanItems.length}
                totalCount={totalItems}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatBadges({
  totalItems,
  outfitCount,
}: {
  totalItems: number;
  outfitCount: number;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-8">
      <Link
        href="/wardrobe"
        className="inline-flex items-center gap-1.5 rounded-full border border-purple-100/70 bg-white/60 px-3.5 py-1.5 text-sm shadow-sm backdrop-blur-sm transition hover:border-accent/30 hover:bg-white/80"
      >
        <span className="font-semibold text-foreground">{totalItems}</span>
        <span className="text-muted">in Closet</span>
      </Link>
      <Link
        href="/generator"
        className="inline-flex items-center gap-1.5 rounded-full border border-purple-100/70 bg-white/60 px-3.5 py-1.5 text-sm shadow-sm backdrop-blur-sm transition hover:border-accent/30 hover:bg-white/80"
      >
        <span className="font-semibold text-foreground">{outfitCount}</span>
        <span className="text-muted">Outfits</span>
      </Link>
    </div>
  );
}

function EmptyStageDropzone() {
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-purple-200 bg-white/80 p-8 text-center shadow-sm sm:p-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft/80 text-accent">
        <HangerIcon />
      </div>
      <p className="mt-5 font-display text-xl font-semibold text-foreground">
        Your stage is empty
      </p>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
        Upload tops, bottoms, and shoes to start styling
      </p>
      <Link
        href="/add-item"
        className="mt-6 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
      >
        Upload items
      </Link>
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

function pickFeaturedPair(cleanItems: ClothingItem[]): ClothingItem[] {
  const onePiece = cleanItems.find(
    (item) => item.category === 'One-Piece' || item.category === 'Saree',
  );
  if (onePiece) {
    const layer = cleanItems.find((item) => item.category === 'Layer');
    return layer ? [onePiece, layer] : [onePiece];
  }

  const top = cleanItems.find(
    (item) =>
      item.category === 'Top' ||
      item.category === 'Kurti' ||
      item.category === 'Corset',
  );
  const bottom = cleanItems.find((item) => item.category === 'Bottom');
  if (top && bottom) return [top, bottom];
  if (top) return [top];
  if (bottom) return [bottom];
  return cleanItems.slice(0, 2);
}

function FeaturedStage({
  featured,
  cleanCount,
  totalCount,
}: {
  featured: ClothingItem[];
  cleanCount: number;
  totalCount: number;
}) {
  if (featured.length === 0) {
    return (
      <div className="w-full overflow-hidden rounded-3xl border border-purple-100/70 bg-surface-elevated/75 px-5 py-12 text-center shadow-sm backdrop-blur-sm sm:px-6 sm:py-14">
        <p className="font-display text-xl font-semibold">
          No clean items ready
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Mark a few pieces as clean and they&apos;ll appear here.
        </p>
        <Link
          href="/wardrobe"
          className="mt-6 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
        >
          Browse wardrobe
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-purple-100/70 bg-surface-elevated/80 shadow-[0_20px_50px_-28px_rgba(45,38,64,0.28)] backdrop-blur-sm">
      <div
        className={`grid ${
          featured.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {featured.map((item) => (
          <div
            key={item.id}
            className="relative aspect-[3/4] overflow-hidden bg-accent-soft/40 sm:max-h-[480px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.title}
              className="relative z-10 h-full w-full object-contain"
            />
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-foreground/55 to-transparent px-3 pb-3 pt-10 sm:px-4 sm:pb-4 sm:pt-12">
              <p className="truncate text-sm font-semibold text-white">
                {item.title}
              </p>
              <p className="truncate text-xs text-white/80">
                {item.category} · {item.color}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Today&apos;s suggestion
          </p>
          <p className="text-xs text-muted">
            {cleanCount} clean · {totalCount} total
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-accent-soft px-2.5 py-1 text-[11px] font-semibold tracking-wide text-accent uppercase">
          Ready
        </span>
      </div>
    </div>
  );
}
