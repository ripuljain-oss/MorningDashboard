import { NextRequest, NextResponse } from 'next/server';
import { BoxScore, BoxScoreTeam, BoxScoreStat } from '@/types';

export const revalidate = 30;

const PERIOD_LABELS: Record<string, string> = {
  basketball: 'Q',
  football: 'Q',
  hockey: 'P',
  baseball: '',
};

function periodLabel(sport: string, index: number): string {
  const prefix = PERIOD_LABELS[sport] ?? '';
  return `${prefix}${index + 1}`;
}

function colorFromTeam(team: any): string {
  const c = team?.color;
  return c ? `#${c}` : '#334155';
}

function parseLinescores(competitor: any): number[] {
  // Baseball uses displayValue; other sports use value
  return (competitor?.linescores ?? []).map((ls: any) =>
    Number(ls.displayValue ?? ls.value ?? 0)
  );
}

// Flatten grouped stats (baseball: { name:'batting', stats:[...] })
// or flat stats (NBA/NHL/NFL: [{ name, displayValue, label }])
function flattenStats(raw: any[]): any[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  // Grouped format: each item has a nested `stats` array
  if (Array.isArray(raw[0]?.stats)) {
    return raw.flatMap((group: any) => group.stats ?? []);
  }
  return raw;
}

function parseStats(boxscoreTeams: any[], homeId: string): BoxScoreStat[] {
  if (!Array.isArray(boxscoreTeams) || boxscoreTeams.length < 2) return [];

  const home = boxscoreTeams.find((t: any) => String(t.team?.id) === homeId) ?? boxscoreTeams[0];
  const away = boxscoreTeams.find((t: any) => String(t.team?.id) !== homeId) ?? boxscoreTeams[1];

  const homeStats = flattenStats(home?.statistics ?? []);
  const awayStats = flattenStats(away?.statistics ?? []);

  const WANTED = [
    // NBA
    'fieldGoalPct', 'threePointFieldGoalPct', 'totalRebounds', 'assists', 'turnovers',
    // NFL
    'totalYards', 'passingYards', 'rushingYards',
    // MLB
    'hits', 'runs', 'homeRuns', 'walks', 'strikeouts',
    // NHL
    'shots', 'savePct',
  ];

  const results: BoxScoreStat[] = [];
  for (const key of WANTED) {
    const hs = homeStats.find((s: any) => s.name === key);
    const as_ = awayStats.find((s: any) => s.name === key);
    if (hs && as_) {
      results.push({
        label: hs.displayName ?? hs.shortDisplayName ?? hs.label ?? hs.name,
        home: hs.displayValue ?? String(hs.value ?? ''),
        away: as_.displayValue ?? String(as_.value ?? ''),
      });
    }
    if (results.length >= 5) break;
  }

  return results;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get('sport');
  const league = searchParams.get('league');
  const gameId = searchParams.get('gameId');

  if (!sport || !league || !gameId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${gameId}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 30 },
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) throw new Error(`ESPN ${res.status}`);
    const data = await res.json();

    const comp = data.header?.competitions?.[0];
    const competitors: any[] = comp?.competitors ?? [];
    const homeComp = competitors.find((c: any) => c.homeAway === 'home') ?? competitors[0];
    const awayComp = competitors.find((c: any) => c.homeAway === 'away') ?? competitors[1];

    const homeLinescores = parseLinescores(homeComp);
    const awayLinescores = parseLinescores(awayComp);
    const numPeriods = Math.max(homeLinescores.length, awayLinescores.length);

    const regularPeriods = sport === 'baseball' ? 9 : sport === 'hockey' ? 3 : 4;
    const periods = Array.from({ length: numPeriods }, (_, i) => {
      if (i < regularPeriods) return periodLabel(sport, i);
      const extra = i - regularPeriods + 1;
      if (sport === 'baseball') return `E${extra}`;
      return `OT${extra > 1 ? extra : ''}`;
    });

    const homeTeam: BoxScoreTeam = {
      name: homeComp?.team?.displayName ?? homeComp?.team?.name ?? 'Home',
      abbr: homeComp?.team?.abbreviation ?? 'HME',
      score: Number(homeComp?.score ?? 0),
      color: colorFromTeam(homeComp?.team),
      linescores: homeLinescores,
    };

    const awayTeam: BoxScoreTeam = {
      name: awayComp?.team?.displayName ?? awayComp?.team?.name ?? 'Away',
      abbr: awayComp?.team?.abbreviation ?? 'AWY',
      score: Number(awayComp?.score ?? 0),
      color: colorFromTeam(awayComp?.team),
      linescores: awayLinescores,
    };

    const statusType = comp?.status?.type;
    const statusDetail = statusType?.detail ?? statusType?.description ?? '';

    const boxscoreTeams = data.boxscore?.teams ?? [];
    const stats = parseStats(boxscoreTeams, String(homeComp?.team?.id));

    const boxScore: BoxScore = {
      homeTeam,
      awayTeam,
      status: statusType?.state ?? 'pre',
      statusDetail,
      periodLabel: PERIOD_LABELS[sport] ?? '',
      periods,
      stats,
    };

    return NextResponse.json(boxScore);
  } catch (err) {
    console.error('Boxscore fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch box score' }, { status: 500 });
  }
}
