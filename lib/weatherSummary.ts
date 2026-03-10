import { WeatherData } from '@/types';

/**
 * One-line weather summary for the Today card, e.g. "Chilly & clear, coat recommended."
 */
export function getWeatherSummary(data: WeatherData): string {
  const { current } = data;
  const temp = current.temp;
  const condition = (current.condition || '').toLowerCase();

  let feel = '';
  if (temp <= 32) feel = 'Freezing';
  else if (temp <= 45) feel = 'Cold';
  else if (temp <= 60) feel = 'Chilly';
  else if (temp <= 75) feel = 'Mild';
  else if (temp <= 85) feel = 'Warm';
  else feel = 'Hot';

  let conditionShort = condition;
  if (condition.includes('clear')) conditionShort = 'clear';
  else if (condition.includes('cloud') || condition.includes('overcast')) conditionShort = 'cloudy';
  else if (condition.includes('rain') || condition.includes('drizzle')) conditionShort = 'rainy';
  else if (condition.includes('snow')) conditionShort = 'snowy';
  else if (condition.includes('fog') || condition.includes('mist')) conditionShort = 'foggy';
  else if (condition.includes('thunder')) conditionShort = 'stormy';

  const coat = temp <= 55 ? ', coat recommended' : temp <= 65 ? ', light layer' : '';
  return `${feel} & ${conditionShort}${coat}.`;
}
