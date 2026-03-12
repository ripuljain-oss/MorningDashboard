import { SportGame, GameStatus } from '@/types';

export interface TeamConfig {
  name: string;
  league: string;
  emoji: string;
  sport: string;
  leagueSlug: string;
  teamId: number;
  accentColor: string;
}

export const CHICAGO_TEAMS: TeamConfig[] = [
  {
    name: 'Bulls',
    league: 'NBA',
    emoji: '🏀',
    sport: 'basketball',
    leagueSlug: 'nba',
    teamId: 4,
    accentColor: '#CE1141',
  },
  {
    name: 'Bears',
    league: 'NFL',
    emoji: '🏈',
    sport: 'football',
    leagueSlug: 'nfl',
    teamId: 3,
    accentColor: '#C83803',
  },
  {
    name: 'Cubs',
    league: 'MLB',
    emoji: '⚾',
    sport: 'baseball',
    leagueSlug: 'mlb',
    teamId: 16,
    accentColor: '#0E3386',
  },
  {
    name: 'White Sox',
    league: 'MLB',
    emoji: '⚾',
    sport: 'baseball',
    leagueSlug: 'mlb',
    teamId: 4,
    accentColor: '#C4CED4',
  },
  {
    name: 'Blackhawks',
    league: 'NHL',
    emoji: '🏒',
    sport: 'hockey',
    leagueSlug: 'nhl',
    teamId: 4,
    accentColor: '#CF0A2C',
  },
];

export function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatGameDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function parseEspnGame(events: any[], team: TeamConfig): SportGame {
  const game = events?.find((e: any) => {
    const comps = e.competitions?.[0]?.competitors || [];
    return comps.some(
      (c: any) =>
        String(c.team?.id) === String(team.teamId) ||
        c.team?.displayName?.toLowerCase().includes(team.name.toLowerCase().split(' ')[0])
    );
  });

  if (!game) {
    return {
      teamName: `Chicago ${team.name}`,
      teamAbbr: team.name,
      league: team.league,
      emoji: team.emoji,
      accentColor: team.accentColor,
      status: 'offseason',
      statusDetail: 'No games scheduled',
    };
  }

  const comp = game.competitions?.[0];
  const comps: any[] = comp?.competitors || [];
  const chiTeam = comps.find((c: any) => String(c.team?.id) === String(team.teamId)) ?? comps[0];
  const oppTeam = comps.find((c: any) => String(c.team?.id) !== String(team.teamId)) ?? comps[1];
  const status = game.status?.type;

  let gameStatus: GameStatus = 'upcoming';
  if (status?.state === 'in') gameStatus = 'live';
  else if (status?.state === 'post') gameStatus = 'final';

  return {
    teamName: `Chicago ${team.name}`,
    teamAbbr: team.name,
    league: team.league,
    emoji: team.emoji,
    accentColor: team.accentColor,
    status: gameStatus,
    chicagoScore: chiTeam?.score !== undefined ? Number(chiTeam.score) : undefined,
    opponentScore: oppTeam?.score !== undefined ? Number(oppTeam.score) : undefined,
    opponentName: oppTeam?.team?.displayName || oppTeam?.team?.name || 'Opponent',
    homeAway: chiTeam?.homeAway === 'home' ? 'home' : 'away',
    statusDetail: gameStatus === 'live'
      ? (status?.detail || 'In Progress')
      : gameStatus === 'final'
      ? timeAgo(game.date)
      : formatGameDate(game.date),
    gameDate: game.date,
    gameId: game.id,
    sport: team.sport,
    leagueSlug: team.leagueSlug,
  };
}
