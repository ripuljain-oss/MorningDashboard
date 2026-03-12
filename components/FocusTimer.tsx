'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Timer } from 'lucide-react';

type Mode = 'work' | 'short' | 'long';

const MODES: Record<Mode, { label: string; seconds: number; accent: string }> = {
  work:  { label: 'Focus',       seconds: 25 * 60, accent: 'var(--accent2)' },
  short: { label: 'Short break', seconds:  5 * 60, accent: 'var(--green)' },
  long:  { label: 'Long break',  seconds: 15 * 60, accent: '#a78bfa' },
};

const SESSIONS_KEY = 'morning-dashboard-focus-sessions';
const RING_R = 52;
const RING_CIRC = 2 * Math.PI * RING_R;

function playDing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // audio not available
  }
}

function loadSessions(): number {
  try {
    const today = new Date().toDateString();
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (parsed.date === today) return parsed.count ?? 0;
    return 0;
  } catch {
    return 0;
  }
}

function saveSessions(count: number) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify({ date: new Date().toDateString(), count }));
  } catch { /* ignore */ }
}

export default function FocusTimer() {
  const [mode, setMode] = useState<Mode>('work');
  const [secondsLeft, setSecondsLeft] = useState(MODES.work.seconds);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  const switchMode = useCallback((m: Mode) => {
    stop();
    setMode(m);
    setSecondsLeft(MODES[m].seconds);
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setSecondsLeft(MODES[mode].seconds);
  }, [stop, mode]);

  const onComplete = useCallback(() => {
    stop();
    playDing();
    if (mode === 'work') {
      const next = sessions + 1;
      setSessions(next);
      saveSessions(next);
    }
  }, [stop, mode, sessions]);

  const toggle = useCallback(() => {
    if (running) {
      stop();
    } else {
      if (secondsLeft === 0) {
        setSecondsLeft(MODES[mode].seconds);
      }
      setRunning(true);
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
  }, [running, stop, secondsLeft, mode]);

  // Watch for completion
  useEffect(() => {
    if (secondsLeft === 0 && running) {
      onComplete();
    }
  }, [secondsLeft, running, onComplete]);

  // Cleanup on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const total = MODES[mode].seconds;
  const progress = secondsLeft / total;
  const dashOffset = RING_CIRC * (1 - progress);
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const { accent } = MODES[mode];
  const isDone = secondsLeft === 0;

  return (
    <div className="focus-timer widget-card">
      <div className="widget-header">
        <div className="widget-title">
          <Timer size={14} />
          Focus Timer
        </div>
        <span className="widget-meta">
          {sessions > 0 ? `${sessions} session${sessions !== 1 ? 's' : ''} today` : 'Pomodoro'}
        </span>
      </div>

      <div className="focus-body">
        {/* Mode tabs */}
        <div className="focus-modes">
          {(Object.keys(MODES) as Mode[]).map((m) => (
            <button
              key={m}
              className={`focus-mode-btn${mode === m ? ' active' : ''}`}
              onClick={() => switchMode(m)}
              style={mode === m ? { color: MODES[m].accent, borderColor: MODES[m].accent } : undefined}
            >
              {MODES[m].label}
            </button>
          ))}
        </div>

        {/* Ring + countdown */}
        <div className="focus-ring-wrap">
          <svg className="focus-ring-svg" viewBox="0 0 120 120" width="120" height="120">
            {/* Track */}
            <circle
              cx="60" cy="60" r={RING_R}
              fill="none"
              stroke="var(--surface3)"
              strokeWidth="6"
            />
            {/* Progress arc */}
            <circle
              cx="60" cy="60" r={RING_R}
              fill="none"
              stroke={isDone ? 'var(--green)' : accent}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset .3s ease' }}
            />
          </svg>
          <div className="focus-countdown">
            <span className="focus-time" style={{ color: isDone ? 'var(--green)' : accent }}>
              {isDone ? 'Done!' : `${mins}:${secs}`}
            </span>
            <span className="focus-mode-label">{MODES[mode].label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="focus-controls">
          <button className="focus-btn focus-btn-secondary" onClick={reset} title="Reset">
            <RotateCcw size={15} />
          </button>
          <button
            className="focus-btn focus-btn-primary"
            onClick={toggle}
            style={{ background: isDone ? 'var(--green-dim)' : undefined, borderColor: isDone ? 'var(--green-border)' : accent }}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
            {running ? 'Pause' : isDone ? 'Restart' : 'Start'}
          </button>
          <button className="focus-btn focus-btn-secondary" onClick={() => switchMode('short')} title="Take a break">
            <Coffee size={15} />
          </button>
        </div>

        {/* Session pips */}
        {sessions > 0 && (
          <div className="focus-pips">
            {Array.from({ length: Math.min(sessions, 8) }).map((_, i) => (
              <span key={i} className="focus-pip" />
            ))}
            {sessions > 8 && <span className="focus-pip-overflow">+{sessions - 8}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
