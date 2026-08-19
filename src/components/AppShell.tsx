'use client';

import type { ReactNode } from 'react';
import { BackendBanner } from '@/components/common/BackendBanner';
import { BottomNav } from '@/components/common/BottomNav';
import { Header } from '@/components/common/Header';
import { OnboardingTour } from '@/components/common/OnboardingTour';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <BackendBanner />
      <main className="mx-auto w-full min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-10">
        {children}
      </main>
      <BottomNav />
      <OnboardingTour />
    </>
  );
}
