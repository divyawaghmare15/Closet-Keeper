import type { Season } from '@/types';

export type WeatherSnapshot = {
  tempC: number;
  weatherCode: number;
  label: string;
  suggestedSeason: Season | 'Any';
  city?: string;
};

/** Open-Meteo weather codes → short label. */
function labelForCode(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 99) return 'Storms';
  return 'Outdoor';
}

function seasonForTemp(tempC: number): Season | 'Any' {
  if (tempC >= 30) return 'Summer';
  if (tempC >= 22) return 'Summer';
  if (tempC >= 16) return 'Monsoon';
  if (tempC >= 10) return 'Fall';
  if (tempC >= 0) return 'Winter';
  return 'Winter';
}

/**
 * Fetch current weather via browser geolocation + Open-Meteo (no API key).
 */
export async function fetchLocalWeather(): Promise<WeatherSnapshot> {
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location not available on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 12_000,
      maximumAge: 30 * 60 * 1000,
    });
  });

  const { latitude, longitude } = position.coords;
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'temperature_2m,weather_code');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Could not load weather');

  const payload = (await response.json()) as {
    current?: { temperature_2m?: number; weather_code?: number };
  };

  const tempC = payload.current?.temperature_2m;
  const weatherCode = payload.current?.weather_code ?? 0;
  if (typeof tempC !== 'number') throw new Error('Weather data incomplete');

  return {
    tempC: Math.round(tempC),
    weatherCode,
    label: labelForCode(weatherCode),
    suggestedSeason: seasonForTemp(tempC),
  };
}
