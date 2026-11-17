'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HomeDashboard } from '@/components/home/HomeDashboard';
import { useAuth } from '@/context/AuthContext';

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

  return <HomeDashboard />;
}
