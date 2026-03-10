import { NextRequest, NextResponse } from 'next/server';
import { parseNewsDataResponse, MOCK_US_NEWS, MOCK_WORLD_NEWS } from '@/lib/news';

export const revalidate = 1800; // 30 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get('category') ?? 'us') as 'us' | 'world';

  const apiKey = process.env.NEWSDATA_API_KEY;

  // If no API key, return mock data
  if (!apiKey) {
    console.warn('NEWSDATA_API_KEY not set — returning mock news data');
    return NextResponse.json(category === 'us' ? MOCK_US_NEWS : MOCK_WORLD_NEWS);
  }

  // Build NewsData.io request
  // country=us for US news; no country filter + priorityDomain=top for world
  const baseUrl = 'https://newsdata.io/api/1/latest';
  const params = new URLSearchParams({
    apikey: apiKey,
    language: 'en',
    ...(category === 'us' ? { country: 'us' } : { prioritydomain: 'top' }),
  });

  try {
    const res = await fetch(`${baseUrl}?${params}`, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`NewsData.io error: ${res.status}`);
    const data = await res.json();
    const articles = parseNewsDataResponse(data, category);
    return NextResponse.json(articles);
  } catch (err) {
    console.error('News API error:', err);
    // Graceful fallback to mock data
    return NextResponse.json(category === 'us' ? MOCK_US_NEWS : MOCK_WORLD_NEWS);
  }
}
