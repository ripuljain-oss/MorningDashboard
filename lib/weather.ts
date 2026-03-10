import { WeatherData, ForecastDay } from '@/types';

export const WMO_CODES: Record<number, [string, string]> = {
  0:  ['☀️', 'Clear Sky'],
  1:  ['🌤', 'Mainly Clear'],
  2:  ['⛅', 'Partly Cloudy'],
  3:  ['☁️', 'Overcast'],
  45: ['🌫', 'Foggy'],
  48: ['🌫', 'Icy Fog'],
  51: ['🌦', 'Light Drizzle'],
  53: ['🌦', 'Drizzle'],
  55: ['🌧', 'Heavy Drizzle'],
  61: ['🌧', 'Light Rain'],
  63: ['🌧', 'Rain'],
  65: ['🌧', 'Heavy Rain'],
  71: ['🌨', 'Light Snow'],
  73: ['❄️', 'Snow'],
  75: ['❄️', 'Heavy Snow'],
  77: ['🌨', 'Snow Grains'],
  80: ['🌦', 'Light Showers'],
  81: ['🌧', 'Showers'],
  82: ['⛈', 'Heavy Showers'],
  85: ['🌨', 'Snow Showers'],
  86: ['❄️', 'Heavy Snow Showers'],
  95: ['⛈', 'Thunderstorm'],
  96: ['⛈', 'Thunderstorm + Hail'],
  99: ['⛈', 'Thunderstorm + Hail'],
};

export function getWmoInfo(code: number): [string, string] {
  return WMO_CODES[code] ?? ['🌡', 'Unknown'];
}

export function celsiusToFahrenheit(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

export function getDayName(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tmrw';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
}

export function parseOpenMeteoResponse(data: any): WeatherData {
  const cur = data.current;
  const daily = data.daily;
  const [icon, condition] = getWmoInfo(cur.weathercode);

  const forecast: ForecastDay[] = daily.time.slice(0, 10).map((date: string, i: number) => {
    const [fi, fc] = getWmoInfo(daily.weathercode[i]);
    return {
      date,
      dayName: getDayName(date, i),
      icon: fi,
      condition: fc,
      high: celsiusToFahrenheit(daily.temperature_2m_max[i]),
      low: celsiusToFahrenheit(daily.temperature_2m_min[i]),
      precipChance: daily.precipitation_probability_max[i] ?? 0,
    };
  });

  return {
    current: {
      temp: celsiusToFahrenheit(cur.temperature_2m),
      feelsLike: celsiusToFahrenheit(cur.apparent_temperature),
      humidity: cur.relative_humidity_2m,
      windSpeed: Math.round(cur.wind_speed_10m),
      precipChance: daily.precipitation_probability_max[0] ?? 0,
      condition,
      icon,
    },
    forecast,
  };
}
