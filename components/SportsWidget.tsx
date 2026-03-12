'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { SportGame, BoxScore } from '@/types';

interface SportsWidgetProps {
  refreshKey: number;
}

const STATUS_CONFIG = {
  live:      { label: '● LIVE',    cls: 'badge-live' },
  final:     { label: 'FINAL',     cls: 'badge-final' },
  upcoming:  { label: 'UPCOMING',  cls: 'badge-upcoming' },
  offseason: { label: 'OFF-SEASON', cls: 'badge-final' },
};

// ─── Box Score Modal ──────────────────────────────────────────────────────────

function BoxScoreModal({ game, onClose }: { game: SportGame; onClose: () => void }) {
  const [data, setData] = useState<BoxScore | null>(null);
  const [error, setError] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const url = `/api/sports/boxscore?sport=${game.sport}&league=${game.leagueSlug}&gameId=${game.gameId}`;
    fetch(url, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: BoxScore) => setData(d))
      .catch(() => setError(true));
    return () => controller.abort();
  }, [game.sport, game.leagueSlug, game.gameId]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const isLive = data?.status === 'in';

  return (
    <div className="bs-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="bs-modal" style={{ '--team-color': game.accentColor } as React.CSSProperties}>
        {/* Header */}
        <div className="bs-modal-header">
          <div className="bs-modal-title">
            <span>{game.emoji}</span>
            {game.teamName} · Box Score
          </div>
          <button className="bs-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {!data && !error && (
          <div className="bs-loading">
            <Loader2 size={20} className="bs-spinner" />
            <span>Loading box score…</span>
          </div>
        )}

        {error && (
          <div className="bs-loading">
            <span>Could not load box score.</span>
          </div>
        )}

        {data && (
          <div className="bs-body">
            {/* Scoreboard */}
            <div className="bs-scoreboard">
              {/* Away team */}
              <div className="bs-team bs-team-away">
                <div className="bs-team-abbr" style={{ color: `#${data.awayTeam.color.replace('#', '')}` || 'var(--text-muted)' }}>
                  {data.awayTeam.abbr}
                </div>
                <div className="bs-team-name">{data.awayTeam.name}</div>
                <div className={`bs-team-score ${data.awayTeam.score > data.homeTeam.score ? 'bs-score-win' : ''}`}>
                  {data.awayTeam.score}
                </div>
              </div>

              <div className="bs-vs-col">
                <div className="bs-status-pill" data-state={data.status}>
                  {isLive ? '● LIVE' : data.status === 'post' ? 'FINAL' : 'UPCOMING'}
                </div>
                <div className="bs-status-detail">{data.statusDetail}</div>
              </div>

              {/* Home team */}
              <div className="bs-team bs-team-home">
                <div className="bs-team-abbr" style={{ color: `#${data.homeTeam.color.replace('#', '')}` || 'var(--text-muted)' }}>
                  {data.homeTeam.abbr}
                </div>
                <div className="bs-team-name">{data.homeTeam.name}</div>
                <div className={`bs-team-score ${data.homeTeam.score > data.awayTeam.score ? 'bs-score-win' : ''}`}>
                  {data.homeTeam.score}
                </div>
              </div>
            </div>

            {/* Line score table */}
            {data.periods.length > 0 && (
              <div className="bs-linescore-wrap">
                <table className="bs-linescore">
                  <thead>
                    <tr>
                      <th className="bs-ls-team-col">Team</th>
                      {data.periods.map((p) => (
                        <th key={p}>{p}</th>
                      ))}
                      <th className="bs-ls-total">T</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="bs-ls-team-col">{data.awayTeam.abbr}</td>
                      {data.periods.map((_, i) => (
                        <td key={i}>{data.awayTeam.linescores[i] ?? '–'}</td>
                      ))}
                      <td className="bs-ls-total">{data.awayTeam.score}</td>
                    </tr>
                    <tr>
                      <td className="bs-ls-team-col">{data.homeTeam.abbr}</td>
                      {data.periods.map((_, i) => (
                        <td key={i}>{data.homeTeam.linescores[i] ?? '–'}</td>
                      ))}
                      <td className="bs-ls-total">{data.homeTeam.score}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Team stats */}
            {data.stats.length > 0 && (
              <div className="bs-stats">
                <div className="bs-stats-header">
                  <span>{data.awayTeam.abbr}</span>
                  <span>Stat</span>
                  <span>{data.homeTeam.abbr}</span>
                </div>
                {data.stats.map((s) => (
                  <div key={s.label} className="bs-stat-row">
                    <span className="bs-stat-val">{s.away}</span>
                    <span className="bs-stat-label">{s.label}</span>
                    <span className="bs-stat-val">{s.home}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sport Card ───────────────────────────────────────────────────────────────

function SportCard({ game, onClick }: { game: SportGame; onClick: () => void }) {
  const badge = STATUS_CONFIG[game.status];
  const isWin =
    game.status === 'final' &&
    game.chicagoScore !== undefined &&
    game.opponentScore !== undefined &&
    game.chicagoScore > game.opponentScore;

  const isClickable = !!game.gameId && game.status !== 'offseason';

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
    <div
      className={`sport-card widget-card${isClickable ? ' sport-card-clickable' : ''}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      title={isClickable ? 'Click for box score' : undefined}
    >
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

        {isClickable && <div className="sport-card-hint">Tap for box score</div>}
      </div>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export default function SportsWidget({ refreshKey }: SportsWidgetProps) {
  const [games, setGames] = useState<SportGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<SportGame | null>(null);

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
        <SportCard
          key={game.teamName}
          game={game}
          onClick={() => setActiveGame(game)}
        />
      ))}

      {activeGame && (
        <BoxScoreModal
          game={activeGame}
          onClose={() => setActiveGame(null)}
        />
      )}
    </>
  );
}
