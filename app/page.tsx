'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import WeatherWidget from '@/components/WeatherWidget';
import NewsWidget from '@/components/NewsWidget';
import SportsWidget from '@/components/SportsWidget';

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    setLastRefreshed(new Date());
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
      setLastRefreshed(new Date());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Header onRefresh={handleRefresh} lastRefreshed={lastRefreshed} />
      <main className="dashboard">
        <div className="section-label"><span>Overview</span></div>
        <div className="top-row">
          <WeatherWidget refreshKey={refreshKey} />
          <NewsWidget refreshKey={refreshKey} />
        </div>
        <div className="section-label"><span>Chicago Sports</span></div>
        <div className="sports-row">
          <SportsWidget refreshKey={refreshKey} />
        </div>
      </main>
    </>
  );
}
