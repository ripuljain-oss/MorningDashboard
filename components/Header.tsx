'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  lastRefreshed: Date | null;
}

export default function Header({ onRefresh, lastRefreshed }: HeaderProps) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="site-header">
      <div className="header-left">
        <div className="logo">
          morning<span className="logo-dot">.</span>dashboard
        </div>
        <div className="live-clock">{clock}</div>
      </div>

      <div className="header-right">
        <div className="live-indicator">
          <span className="live-dot" />
          Live
        </div>
        {lastRefreshed && (
          <span className="last-refresh">
            Updated {lastRefreshed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <button className="refresh-btn" onClick={onRefresh} title="Refresh all data">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>
    </header>
  );
}
