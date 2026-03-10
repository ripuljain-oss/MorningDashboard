# Morning Dashboard

A personal daily dashboard for weather, news, and Chicago sports — built with Next.js 16, Tailwind CSS v4, and TypeScript.

## Features

| Widget | Data Source | Key Required |
|---|---|---|
| 🌤 Weather + 10-day forecast | [Open-Meteo](https://open-meteo.com/) | No |
| 📰 US & World News | [NewsData.io](https://newsdata.io/) | Yes (free tier) |
| 🏀🏈⚾🏒 Chicago Sports | [ESPN Unofficial API](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b) | No |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your NewsData.io key (optional — falls back to mock headlines)
cp .env.example .env.local
# Edit .env.local and add: NEWSDATA_API_KEY=your_key

# 3. Run locally
npm run dev
# → http://localhost:3000
```

## API Keys

### NewsData.io (News Widget)
1. Register free at [newsdata.io/register](https://newsdata.io/register)
2. Copy your API key from the dashboard
3. Add to `.env.local`: `NEWSDATA_API_KEY=your_key`

**Without a key**, the app shows curated mock headlines (realistic, but not live).

### Weather & Sports
No keys needed — Open-Meteo and ESPN unofficial endpoints are fully open.

## Project Structure

```
app/
  page.tsx                  # Main dashboard page
  layout.tsx                # Root layout with fonts
  globals.css               # Design system & all styles
  api/
    weather/route.ts        # Proxies Open-Meteo
    news/route.ts           # Proxies NewsData.io (with mock fallback)
    sports/route.ts         # Proxies ESPN unofficial API

components/
  Header.tsx                # Sticky header with clock & refresh
  WeatherWidget.tsx         # Current conditions + 10-day forecast
  NewsWidget.tsx            # Tabbed US/World headlines
  SportsWidget.tsx          # Chicago Bulls, Bears, Cubs, Sox, Hawks

lib/
  weather.ts                # WMO code mapping, temp conversion
  news.ts                   # NewsData.io parser, mock data
  sports.ts                 # ESPN parser, team config

types/
  index.ts                  # Shared TypeScript types
```

## Deploy to Vercel

```bash
# Push to GitHub, then:
# 1. vercel.com → New Project → Import your repo
# 2. Add NEWSDATA_API_KEY in Project Settings → Environment Variables
# 3. Deploy
```

## Phase 2 Ideas

- Kalshi prediction markets widget
- Titan portfolio snapshot
- CrossFit WOD feed
- Watch wishlist tracker (Grand Seiko / Rolex)
- Lightroom photo gallery
- Quick daily notes pad
