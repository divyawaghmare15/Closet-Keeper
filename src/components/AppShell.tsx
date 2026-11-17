'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthGate } from '@/components/common/AuthGate';
import { BackendBanner } from '@/components/common/BackendBanner';
import { BottomNav } from '@/components/common/BottomNav';
import { Header } from '@/components/common/Header';
import { OnboardingTour } from '@/components/common/OnboardingTour';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === '/auth' || pathname.startsWith('/auth/');

  if (isAuthPage) {
    return (
      <main className="mx-auto w-full min-w-0 flex-1">{children}</main>
    );
  }

  return (
    <>
      <Header />
      <BackendBanner />
      <main className="mx-auto w-full min-w-0 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-10">
        <AuthGate>{children}</AuthGate>
      </main>
      <BottomNav />
      <OnboardingTour />
    </>
  );
}
