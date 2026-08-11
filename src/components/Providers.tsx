'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { WardrobeProvider } from '@/context/WardrobeContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WardrobeProvider>{children}</WardrobeProvider>
    </AuthProvider>
  );
}
