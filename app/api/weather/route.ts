import { NextRequest, NextResponse } from 'next/server';
import { parseOpenMeteoResponse } from '@/lib/weather';

export const revalidate = 1800; // 30 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat') ?? '41.8781';
  const lon = searchParams.get('lon') ?? '-87.6298';

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weathercode` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&temperature_unit=celsius&wind_speed_unit=mph&timezone=auto&forecast_days=10`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
    const data = await res.json();
    const parsed = parseOpenMeteoResponse(data);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Weather API error:', err);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}
