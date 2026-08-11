'use client';

import Link from 'next/link';
import { useWardrobe } from '@/context/WardrobeContext';
import type { ClothingItem } from '@/types';

export default function HomePage() {
  const { items } = useWardrobe();
  const cleanItems = items.filter((item) => item.isClean);
  const featured = pickFeaturedPair(cleanItems);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col">
      <section className="relative flex min-h-[calc(100svh-4rem)] flex-col px-4 py-6 sm:px-6 sm:py-8 lg:min-h-[calc(100svh-4rem)] lg:px-10 lg:py-12">
        <div
          aria-hidden
          className="animate-soft-pulse pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(ellipse_at_center,rgba(228,217,245,0.75),transparent_70%)] lg:h-[60%]"
        />

        <header className="animate-fade-up relative z-10 lg:hidden">
          <p className="font-display text-4xl leading-none font-semibold tracking-tight text-foreground sm:text-5xl">
            ClosetKeeper
          </p>
        </header>

        <div className="relative z-10 mt-6 grid flex-1 gap-8 sm:mt-8 lg:mt-4 lg:grid-cols-2 lg:items-center lg:gap-12 xl:gap-16">
          <div className="animate-fade-up max-w-xl" style={{ animationDelay: '80ms' }}>
            <h1 className="font-display text-3xl leading-tight font-medium tracking-tight text-foreground sm:text-4xl xl:text-5xl">
              What to wear today
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              Start from a calm suggestion, then refine your closet when you need
              it.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-7 sm:gap-3">
              <Link
                href="/generator"
                className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] sm:px-6 sm:py-3.5"
              >
                Build outfit
              </Link>
              <Link
                href="/add-item"
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70 sm:px-5 sm:py-3.5"
              >
                Add item
              </Link>
              <Link
                href="/capsule"
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70 sm:px-5 sm:py-3.5"
              >
                Capsule
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted sm:mt-8 sm:gap-6">
              <p>
                <span className="font-semibold text-foreground">{cleanItems.length}</span>{' '}
                clean
              </p>
              <p>
                <span className="font-semibold text-foreground">{items.length}</span>{' '}
                total
              </p>
              <Link
                href="/wardrobe"
                className="font-semibold text-accent transition hover:underline"
              >
                Browse wardrobe →
              </Link>
            </div>
          </div>

          <div
            className="animate-fade-up w-full min-w-0"
            style={{ animationDelay: '160ms' }}
          >
            <FeaturedStage
              featured={featured}
              cleanCount={cleanItems.length}
              totalCount={items.length}
            />
          </div>
        </div>
      </section>
    </div>
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
      <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-surface-elevated/75 px-5 py-12 text-center shadow-sm backdrop-blur-sm sm:rounded-[2rem] sm:px-6 sm:py-14">
        <p className="font-display text-xl font-semibold">Your day starts empty</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Add a few pieces and this space becomes today’s outfit stage.
        </p>
        <Link
          href="/add-item"
          className="mt-6 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
        >
          Add your first item
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/50 bg-surface-elevated/80 shadow-[0_20px_50px_-28px_rgba(45,38,64,0.28)] backdrop-blur-sm sm:rounded-[2rem]">
      <div
        className={`grid ${
          featured.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {featured.map((item) => (
          <div
            key={item.id}
            className="relative aspect-[3/4] max-h-[420px] min-h-[220px] bg-accent-soft/30 sm:min-h-[280px] lg:aspect-auto lg:min-h-[360px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/55 to-transparent px-3 pb-3 pt-10 sm:px-4 sm:pb-4 sm:pt-12">
              <p className="truncate text-sm font-semibold text-white">{item.title}</p>
              <p className="truncate text-xs text-white/80">
                {item.category} · {item.color}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Today’s suggestion</p>
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
