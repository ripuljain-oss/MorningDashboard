'use client';

import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  lastRefreshed: Date | null;
}

export default function Header({ onRefresh, lastRefreshed }: HeaderProps) {

  return (
    <header className="site-header">
      <div className="header-left">
        <div className="logo">
          morning<span className="logo-dot">.</span>dashboard
        </div>
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
