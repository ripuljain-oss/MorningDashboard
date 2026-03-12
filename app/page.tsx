'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import TodayCard from '@/components/TodayCard';
import WeatherWidget from '@/components/WeatherWidget';
import NewsWidget from '@/components/NewsWidget';
import SportsWidget from '@/components/SportsWidget';
import FocusTimer from '@/components/FocusTimer';
import type { TimeOfDay } from '@/components/TodayCard';

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'day';
}

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => getTimeOfDay());

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

  // Update time-of-day every minute so layout switches at 5am/11am/5pm/10pm
  useEffect(() => {
    const t = setInterval(() => setTimeOfDay(getTimeOfDay()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const isEvening = timeOfDay === 'evening';

  return (
    <>
      <Header onRefresh={handleRefresh} lastRefreshed={lastRefreshed} />
      <main className="dashboard">
        <TodayCard timeOfDay={timeOfDay} refreshKey={refreshKey} />

        {isEvening ? (
          <>
            <div className="section-label"><span>Tonight&apos;s games</span></div>
            <div className="sports-row">
              <SportsWidget refreshKey={refreshKey} />
            </div>
            <div className="section-label"><span>Overview</span></div>
            <div className="top-row">
              <WeatherWidget refreshKey={refreshKey} />
              <NewsWidget refreshKey={refreshKey} />
            </div>
          </>
        ) : (
          <>
            <div className="section-label"><span>Overview</span></div>
            <div className="top-row">
              <WeatherWidget refreshKey={refreshKey} />
              <NewsWidget refreshKey={refreshKey} />
            </div>
            <div className="section-label"><span>Chicago Sports</span></div>
            <div className="sports-row">
              <SportsWidget refreshKey={refreshKey} />
            </div>
          </>
        )}

        <div className="section-label"><span>Focus</span></div>
        <div className="focus-row">
          <FocusTimer />
        </div>
      </main>
    </>
  );
}
