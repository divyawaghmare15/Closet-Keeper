'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchLocalWeather, type WeatherSnapshot } from '@/lib/weather';
import type { Season } from '@/types';

export function WeatherChip({
  onSeasonHint,
}: {
  onSeasonHint?: (season: Season | 'Any') => void;
}) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const snapshot = await fetchLocalWeather();
      setWeather(snapshot);
      onSeasonHint?.(snapshot.suggestedSeason);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Allow location to get weather tips.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !weather) {
    return (
      <p className="text-sm text-muted">Checking today’s weather…</p>
    );
  }

  if (error && !weather) {
    return (
      <button
        type="button"
        onClick={() => void load()}
        className="text-left text-sm font-semibold text-accent hover:underline"
      >
        Enable location for weather tips
      </button>
    );
  }

  if (!weather) return null;

  const seasonParam =
    weather.suggestedSeason === 'Any'
      ? 'Casual'
      : weather.suggestedSeason;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-100/70 bg-white/70 px-3 py-1.5 text-sm shadow-sm">
        <span className="font-semibold text-foreground">
          {weather.tempC}°C
        </span>
        <span className="text-muted">{weather.label}</span>
      </span>
      <Link
        href={`/generator?occasion=Casual&season=${encodeURIComponent(String(weather.suggestedSeason))}`}
        className="text-sm font-semibold text-accent hover:underline"
      >
        Suggest for {seasonParam} →
      </Link>
    </div>
  );
}
