// Weather types
export interface WeatherCurrent {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipChance: number;
  condition: string;
  icon: string;
}

export interface ForecastDay {
  date: string;
  dayName: string;
  icon: string;
  condition: string;
  high: number;
  low: number;
  precipChance: number;
}

export interface WeatherData {
  current: WeatherCurrent;
  forecast: ForecastDay[];
  locationName?: string;
}

// News types
export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  time: string;
  url: string;
  imageUrl?: string;
}

export interface NewsData {
  us: NewsArticle[];
  world: NewsArticle[];
}

// Sports types
export type GameStatus = 'live' | 'final' | 'upcoming' | 'offseason';

export interface SportGame {
  teamName: string;
  teamAbbr: string;
  league: string;
  emoji: string;
  accentColor: string;
  status: GameStatus;
  chicagoScore?: number;
  opponentScore?: number;
  opponentName?: string;
  homeAway?: 'home' | 'away';
  statusDetail?: string;
  gameDate?: string;
  gameId?: string;
  sport?: string;
  leagueSlug?: string;
}

export interface BoxScoreTeam {
  name: string;
  abbr: string;
  score: number;
  color: string;
  linescores: number[];
}

export interface BoxScoreStat {
  label: string;
  home: string;
  away: string;
}

export interface BoxScore {
  homeTeam: BoxScoreTeam;
  awayTeam: BoxScoreTeam;
  status: string;
  statusDetail: string;
  periodLabel: string;
  periods: string[];
  stats: BoxScoreStat[];
}
