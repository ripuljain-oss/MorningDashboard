'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeatherData } from '@/types';
import { Wind, Droplets, Thermometer, CloudRain } from 'lucide-react';

interface WeatherWidgetProps {
  refreshKey: number;
}

export default function WeatherWidget({ refreshKey }: WeatherWidgetProps) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [locationName, setLocationName] = useState('Detecting location…');

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error();
      const json: WeatherData = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const gd = await res.json();
      const city =
        gd.address?.city || gd.address?.town || gd.address?.suburb || 'Your Location';
      const state = gd.address?.state_code || '';
      setLocationName(`${city}${state ? ', ' + state : ''}`);
    } catch {
      setLocationName('Your Location');
    }
  }, []);

  useEffect(() => {
    const chicagoLat = 41.8781;
    const chicagoLon = -87.6298;

    // Always fetch weather immediately with Chicago fallback so we never spin forever
    fetchWeather(chicagoLat, chicagoLon);
    setLocationName('Chicago, IL');

    if (!navigator.geolocation) return;

    const timeoutId = setTimeout(() => {
      // If we still say "Detecting location…" after timeout, keep Chicago
      setLocationName((prev) => (prev === 'Detecting location…' ? 'Chicago, IL' : prev));
    }, 8000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        reverseGeocode(lat, lon);
        fetchWeather(lat, lon);
      },
      () => {
        setLocationName('Chicago, IL');
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
    );

    return () => clearTimeout(timeoutId);
  }, [fetchWeather, reverseGeocode, refreshKey]);

  return (
    <div className="widget-card">
      <div className="widget-header">
        <div className="widget-title">
          <span className="widget-icon">🌤</span>
          Weather
        </div>
        <span className="widget-meta">{locationName}</span>
      </div>

      <div className="weather-body">
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <span>Fetching weather…</span>
          </div>
        )}

        {error && !loading && (
          <div className="error-state">⚠️ Could not load weather data</div>
        )}

        {data && !loading && (
          <>
            {/* Current conditions */}
            <div className="weather-current">
              <div className="weather-temp-group">
                <div className="weather-temp">{data.current.temp}°</div>
                <div className="weather-condition">{data.current.condition}</div>
              </div>
              <div className="weather-icon-big">{data.current.icon}</div>
            </div>

            {/* Meta grid */}
            <div className="weather-meta-grid">
              <div className="meta-item">
                <Thermometer size={12} className="meta-icon" />
                <span className="meta-label">Feels Like</span>
                <span className="meta-value">{data.current.feelsLike}°F</span>
              </div>
              <div className="meta-item">
                <Droplets size={12} className="meta-icon" />
                <span className="meta-label">Humidity</span>
                <span className="meta-value">{data.current.humidity}%</span>
              </div>
              <div className="meta-item">
                <Wind size={12} className="meta-icon" />
                <span className="meta-label">Wind</span>
                <span className="meta-value">{data.current.windSpeed} mph</span>
              </div>
              <div className="meta-item">
                <CloudRain size={12} className="meta-icon" />
                <span className="meta-label">Precip</span>
                <span className="meta-value">{data.current.precipChance}%</span>
              </div>
            </div>

            {/* Forecast strip */}
            <div className="forecast-label">10-Day Forecast</div>
            <div className="forecast-strip">
              {data.forecast.map((day) => (
                <div key={day.date} className="forecast-day">
                  <div className="forecast-day-name">{day.dayName}</div>
                  <div className="forecast-day-icon">{day.icon}</div>
                  <div className="forecast-day-hi">{day.high}°</div>
                  <div className="forecast-day-lo">{day.low}°</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
