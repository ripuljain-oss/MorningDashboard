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
  return (competitor?.linescores ?? []).map((ls: any) => Number(ls.value ?? 0));
}

function parseStats(boxscoreTeams: any[], homeId: string): BoxScoreStat[] {
  if (!Array.isArray(boxscoreTeams) || boxscoreTeams.length < 2) return [];

  const home = boxscoreTeams.find((t: any) => String(t.team?.id) === homeId) ?? boxscoreTeams[0];
  const away = boxscoreTeams.find((t: any) => String(t.team?.id) !== homeId) ?? boxscoreTeams[1];

  const homeStats: any[] = home?.statistics ?? [];
  const awayStats: any[] = away?.statistics ?? [];

  const WANTED = [
    'fieldGoalPct', 'threePointFieldGoalPct', 'totalRebounds', 'assists', 'turnovers',
    'totalYards', 'passingYards', 'rushingYards',
    'hits', 'errors',
    'shots', 'savePct',
  ];

  const results: BoxScoreStat[] = [];
  for (const key of WANTED) {
    const hs = homeStats.find((s: any) => s.name === key);
    const as_ = awayStats.find((s: any) => s.name === key);
    if (hs && as_) {
      results.push({
        label: hs.label ?? hs.name,
        home: hs.displayValue ?? String(hs.value ?? ''),
        away: as_.displayValue ?? String(as_.value ?? ''),
      });
    }
    if (results.length >= 5) break;
  }

  // Fallback: take first 5 stats from home team if none matched
  if (results.length === 0) {
    for (const hs of homeStats.slice(0, 5)) {
      const as_ = awayStats.find((s: any) => s.name === hs.name);
      results.push({
        label: hs.label ?? hs.name,
        home: hs.displayValue ?? String(hs.value ?? ''),
        away: as_?.displayValue ?? as_?.value ?? '–',
      });
    }
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

    const periods = Array.from({ length: numPeriods }, (_, i) => {
      // Label OT periods properly
      const regularPeriods = sport === 'baseball' ? 9 : sport === 'hockey' ? 3 : 4;
      if (i < regularPeriods) return periodLabel(sport, i);
      return `OT${i - regularPeriods > 0 ? i - regularPeriods + 1 : ''}`;
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
