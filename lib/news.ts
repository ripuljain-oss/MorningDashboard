import { NewsArticle } from '@/types';

// Sample articles matching NewsData.io response shape.
// Replace with live API call once you add your NEWSDATA_API_KEY to .env.local
export const MOCK_US_NEWS: NewsArticle[] = [
  { id: 'us-1', headline: 'Federal Reserve holds interest rates steady, signals patience before any cuts', source: 'Reuters', time: '2h ago', url: 'https://reuters.com' },
  { id: 'us-2', headline: 'Senate passes bipartisan infrastructure maintenance bill with $180B in funding', source: 'AP News', time: '3h ago', url: 'https://apnews.com' },
  { id: 'us-3', headline: 'Tech giants face renewed scrutiny as DOJ opens antitrust investigation', source: 'WSJ', time: '4h ago', url: 'https://wsj.com' },
  { id: 'us-4', headline: 'Midwest storm system brings heavy snow and freezing rain to Chicago region', source: 'WGN', time: '5h ago', url: 'https://wgntv.com' },
  { id: 'us-5', headline: 'US economy added 275,000 jobs in February, exceeding analyst expectations', source: 'Bloomberg', time: '6h ago', url: 'https://bloomberg.com' },
  { id: 'us-6', headline: 'FAA clears Boeing 737 MAX 10 for commercial service after extended review', source: 'CNBC', time: '7h ago', url: 'https://cnbc.com' },
  { id: 'us-7', headline: 'Supreme Court hears arguments in landmark social media regulation case', source: 'NYT', time: '8h ago', url: 'https://nytimes.com' },
  { id: 'us-8', headline: 'New cybersecurity executive order targets critical infrastructure vulnerabilities', source: 'Politico', time: '9h ago', url: 'https://politico.com' },
  { id: 'us-9', headline: 'Consumer confidence index hits six-month high on falling inflation data', source: 'FT', time: '10h ago', url: 'https://ft.com' },
  { id: 'us-10', headline: 'Chicago mayoral office announces $1.2B development plan for South Side', source: 'Tribune', time: '11h ago', url: 'https://chicagotribune.com' },
];

export const MOCK_WORLD_NEWS: NewsArticle[] = [
  { id: 'w-1', headline: 'G7 finance ministers meet in Rome to coordinate response to global debt concerns', source: 'BBC', time: '1h ago', url: 'https://bbc.com' },
  { id: 'w-2', headline: 'Ceasefire negotiations advance as international mediators return to talks', source: 'Al Jazeera', time: '2h ago', url: 'https://aljazeera.com' },
  { id: 'w-3', headline: 'Bank of England signals possible rate cut as UK inflation falls to 3.2%', source: 'Guardian', time: '3h ago', url: 'https://theguardian.com' },
  { id: 'w-4', headline: 'Taiwan Strait tensions rise as China conducts naval exercises near disputed islands', source: 'Reuters', time: '4h ago', url: 'https://reuters.com' },
  { id: 'w-5', headline: 'EU reaches agreement on landmark AI governance framework after months of debate', source: 'Politico EU', time: '5h ago', url: 'https://politico.eu' },
  { id: 'w-6', headline: "Japan's Nikkei closes at 3-month high as yen weakens against the dollar", source: 'Nikkei', time: '6h ago', url: 'https://nikkei.com' },
  { id: 'w-7', headline: 'OPEC+ extends production cuts through Q2 as oil prices remain volatile', source: 'FT', time: '7h ago', url: 'https://ft.com' },
  { id: 'w-8', headline: 'Mexico presidential election campaign kicks off with record number of candidates', source: 'NYT', time: '8h ago', url: 'https://nytimes.com' },
  { id: 'w-9', headline: 'Indian Ocean trade route disruptions push container shipping costs to new highs', source: 'Bloomberg', time: '9h ago', url: 'https://bloomberg.com' },
  { id: 'w-10', headline: 'Climate summit produces binding agreement on methane emissions reduction', source: 'Guardian', time: '10h ago', url: 'https://theguardian.com' },
];

function normalizeHeadline(headline: string): string {
  return headline.trim().toLowerCase().slice(0, 120);
}

export function parseNewsDataResponse(data: any, category: 'us' | 'world'): NewsArticle[] {
  if (!data?.results) return category === 'us' ? MOCK_US_NEWS : MOCK_WORLD_NEWS;

  const seen = new Set<string>();
  const articles: NewsArticle[] = [];

  for (const item of data.results) {
    const headline = item.title ?? 'Untitled';
    const key = normalizeHeadline(headline);
    if (seen.has(key)) continue; // skip syndicated duplicates
    seen.add(key);

    const pub = item.pubDate ? new Date(item.pubDate) : null;
    const now = new Date();
    const diffMin = pub ? Math.floor((now.getTime() - pub.getTime()) / 60000) : 0;
    let timeStr = 'recently';
    if (diffMin < 60) timeStr = `${diffMin}m ago`;
    else if (diffMin < 1440) timeStr = `${Math.floor(diffMin / 60)}h ago`;
    else timeStr = pub?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? 'recently';

    articles.push({
      id: item.article_id ?? `${category}-${articles.length}`,
      headline,
      source: item.source_name ?? item.source_id ?? 'Unknown',
      time: timeStr,
      url: item.link ?? '#',
      imageUrl: item.image_url ?? undefined,
    });

    if (articles.length >= 10) break;
  }

  return articles.length > 0 ? articles : category === 'us' ? MOCK_US_NEWS : MOCK_WORLD_NEWS;
}
