import { NextRequest, NextResponse } from 'next/server';
import { CHICAGO_TEAMS, parseEspnGame } from '@/lib/sports';
import { SportGame } from '@/types';

export const revalidate = 60; // 1 minute for live scores

export async function GET(_req: NextRequest) {
  const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

  const results = await Promise.allSettled(
    CHICAGO_TEAMS.map(async (team) => {
      const url = `${ESPN_BASE}/${team.sport}/${team.leagueSlug}/scoreboard`;
      const res = await fetch(url, {
        next: { revalidate: 60 },
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) throw new Error(`ESPN error for ${team.name}: ${res.status}`);
      const data = await res.json();
      return parseEspnGame(data.events ?? [], team);
    })
  );

  const games: SportGame[] = results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value;
    console.error(`Sports fetch failed for ${CHICAGO_TEAMS[i].name}:`, result.reason);
    return {
      teamName: `Chicago ${CHICAGO_TEAMS[i].name}`,
      teamAbbr: CHICAGO_TEAMS[i].name,
      league: CHICAGO_TEAMS[i].league,
      emoji: CHICAGO_TEAMS[i].emoji,
      accentColor: CHICAGO_TEAMS[i].accentColor,
      status: 'offseason' as const,
      statusDetail: 'Data unavailable',
    };
  });

  return NextResponse.json(games);
}
