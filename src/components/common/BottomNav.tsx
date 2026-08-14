'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/wardrobe',
    label: 'Closet',
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <path
          d="M6 4h12a1 1 0 0 1 1 1v15H5V5a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M12 4v16M9 12h.01"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/add-item',
    label: 'Add',
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/generator',
    label: 'Looks',
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <path
          d="M8 4h8l2 4-6 11L6 8l2-4Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M6 8h12"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/misc',
    label: 'Extras',
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <rect
          x="4"
          y="5"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <rect
          x="13"
          y="5"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <rect
          x="4"
          y="14"
          width="7"
          height="5"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <rect
          x="13"
          y="14"
          width="7"
          height="5"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-surface-elevated/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Mobile"
    >
      <ul className="mx-auto flex h-16 max-w-3xl items-stretch justify-around px-1 sm:px-2">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-semibold transition sm:text-[11px] ${
                  active ? 'text-accent' : 'text-muted hover:text-foreground'
                }`}
              >
                <span
                  className={`rounded-xl p-1 sm:p-1.5 ${
                    active ? 'bg-accent-soft text-accent' : ''
                  }`}
                >
                  {icon}
                </span>
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
