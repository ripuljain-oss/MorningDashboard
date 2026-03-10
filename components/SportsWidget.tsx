'use client';

import { useState, useEffect, useCallback } from 'react';
import { SportGame } from '@/types';

interface SportsWidgetProps {
  refreshKey: number;
}

const STATUS_CONFIG = {
  live:      { label: '● LIVE',    cls: 'badge-live' },
  final:     { label: 'FINAL',     cls: 'badge-final' },
  upcoming:  { label: 'UPCOMING',  cls: 'badge-upcoming' },
  offseason: { label: 'OFF-SEASON', cls: 'badge-final' },
};

function SportCard({ game }: { game: SportGame }) {
  const badge = STATUS_CONFIG[game.status];
  const isWin =
    game.status === 'final' &&
    game.chicagoScore !== undefined &&
    game.opponentScore !== undefined &&
    game.chicagoScore > game.opponentScore;

  const scoreLine = () => {
    if (game.status === 'live' || game.status === 'final') {
      if (game.chicagoScore !== undefined && game.opponentScore !== undefined) {
        return (
          <span className={`game-score ${isWin ? 'win' : ''}`}>
            {game.chicagoScore}–{game.opponentScore}
          </span>
        );
      }
    }
    if (game.status === 'upcoming') {
      return <span className="game-score upcoming-score">TBD</span>;
    }
    return <span className="game-score upcoming-score">–</span>;
  };

  const homeAway = game.homeAway === 'home' ? 'vs' : '@';

  return (
    <div className="sport-card widget-card">
      <div className="widget-header">
        <div className="widget-title">
          <span className="widget-icon">{game.emoji}</span>
          {game.league}
        </div>
        <span className={`badge ${badge.cls}`}>{badge.label}</span>
      </div>

      <div className="sport-body">
        <div className="team-row">
          <div className="team-info">
            <div
              className="team-logo"
              style={{
                background: `${game.accentColor}18`,
                borderColor: `${game.accentColor}44`,
              }}
            >
              {game.emoji}
            </div>
            <div>
              <div className="team-name">{game.teamName}</div>
              <div className="team-league">{game.league}</div>
            </div>
          </div>
          {scoreLine()}
        </div>

        <div className="game-details">
          {game.opponentName ? (
            <div className="game-opponent">
              {homeAway} {game.opponentName}
            </div>
          ) : (
            <div className="game-opponent muted">No game scheduled</div>
          )}
          <div className="game-info">{game.statusDetail}</div>
        </div>
      </div>
    </div>
  );
}

export default function SportsWidget({ refreshKey }: SportsWidgetProps) {
  const [games, setGames] = useState<SportGame[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sports');
      const data: SportGame[] = await res.json();
      setGames(data);
    } catch {
      console.error('Sports fetch failed');
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => { fetchSports(); }, [fetchSports]);

  if (loading) {
    return (
      <>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="sport-card widget-card">
            <div className="loading-state">
              <div className="spinner" />
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {games.map((game) => (
        <SportCard key={game.teamName} game={game} />
      ))}
    </>
  );
}
