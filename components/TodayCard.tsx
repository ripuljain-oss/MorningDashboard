'use client';

import { useState, useEffect } from 'react';
import { WeatherData } from '@/types';
import { NewsArticle } from '@/types';
import { getWeatherSummary } from '@/lib/weatherSummary';
import { ExternalLink } from 'lucide-react';

export type TimeOfDay = 'morning' | 'evening' | 'day';

interface TodayCardProps {
  timeOfDay: TimeOfDay;
  refreshKey: number;
}

export default function TodayCard({ timeOfDay, refreshKey }: TodayCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [headlines, setHeadlines] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const [weatherRes, usRes, worldRes] = await Promise.all([
          fetch('/api/weather?lat=41.8781&lon=-87.6298'),
          fetch('/api/news?category=us'),
          fetch('/api/news?category=world'),
        ]);

        if (cancelled) return;

        const weatherData: WeatherData | null = weatherRes.ok ? await weatherRes.json() : null;
        const us = usRes.ok ? await usRes.json() : [];
        const world = worldRes.ok ? await worldRes.json() : [];
        const combined = [...(Array.isArray(us) ? us : []), ...(Array.isArray(world) ? world : [])];
        const top3 = combined.slice(0, 3);

        setWeather(weatherData ?? null);
        setHeadlines(top3);
      } catch {
        if (!cancelled) {
          setWeather(null);
          setHeadlines([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const summary = weather ? getWeatherSummary(weather) : null;
  const tomorrow = weather?.forecast?.[1];

  const isMorning = timeOfDay === 'morning';
  const isEvening = timeOfDay === 'evening';

  return (
    <div className="today-card widget-card">
      <div className="widget-header">
        <div className="widget-title">
          <span className="widget-icon">📌</span>
          {isMorning ? 'Good morning' : isEvening ? 'Evening briefing' : 'Today'}
        </div>
        <span className="widget-meta">
          {isMorning ? 'Weather · Headlines · Note' : isEvening ? 'Tomorrow · Headlines · Note' : 'Your focus'}
        </span>
      </div>

      <div className="today-body">
        {loading && (
          <div className="loading-state today-loading">
            <div className="spinner" />
            <span>Loading your briefing…</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Weather: morning = summary; evening = tomorrow's forecast */}
            <div className="today-weather-row">
              {isMorning && summary && (
                <p className="today-summary">{summary}</p>
              )}
              {isEvening && tomorrow && (
                <p className="today-summary">
                  <span className="today-tomorrow-label">Tomorrow:</span>{' '}
                  {tomorrow.icon} {tomorrow.high}° / {tomorrow.low}° — {tomorrow.condition}
                </p>
              )}
              {!isMorning && !isEvening && summary && (
                <p className="today-summary">{summary}</p>
              )}
              {!summary && !tomorrow && !loading && (
                <p className="today-summary today-summary-muted">No weather data</p>
              )}
            </div>

            {/* Top 3 headlines */}
            <div className="today-headlines">
              <span className="today-headlines-label">Top headlines</span>
              <ul className="today-headlines-list">
                {headlines.map((a) => (
                  <li key={a.id}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="today-headline-link">
                      <span className="today-headline-text">{a.headline}</span>
                      <ExternalLink size={12} className="today-headline-arrow" />
                    </a>
                    <span className="today-headline-meta">{a.source} · {a.time}</span>
                  </li>
                ))}
              </ul>
              {headlines.length === 0 && (
                <p className="today-summary-muted">No headlines right now</p>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  );
}
