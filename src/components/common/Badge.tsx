import type { ReactNode } from 'react';

type BadgeVariant = 'clean' | 'wash' | 'category' | 'neutral';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  clean: 'bg-accent-soft text-accent',
  wash: 'bg-wash-soft text-wash',
  category: 'bg-surface text-foreground ring-1 ring-border',
  neutral: 'bg-accent-soft/60 text-accent',
};

export function Badge({
  children,
  variant = 'neutral',
  className = '',
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function CleanBadge({ isClean }: { isClean: boolean }) {
  return (
    <Badge variant={isClean ? 'clean' : 'wash'}>
      {isClean ? 'Clean' : 'In wash'}
    </Badge>
  );
}
