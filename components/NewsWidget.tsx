'use client';

import { useState, useEffect, useCallback } from 'react';
import { NewsArticle } from '@/types';
import { ExternalLink } from 'lucide-react';

interface NewsWidgetProps {
  refreshKey: number;
}

export default function NewsWidget({ refreshKey }: NewsWidgetProps) {
  const [usNews, setUsNews] = useState<NewsArticle[]>([]);
  const [worldNews, setWorldNews] = useState<NewsArticle[]>([]);
  const [activeTab, setActiveTab] = useState<'us' | 'world'>('us');
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const [usRes, worldRes] = await Promise.all([
        fetch('/api/news?category=us'),
        fetch('/api/news?category=world'),
      ]);
      const [usData, worldData] = await Promise.all([usRes.json(), worldRes.json()]);
      setUsNews(Array.isArray(usData) ? usData : []);
      setWorldNews(Array.isArray(worldData) ? worldData : []);
    } catch {
      console.error('News fetch failed');
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const articles = activeTab === 'us' ? usNews : worldNews;

  return (
    <div className="widget-card">
      <div className="widget-header">
        <div className="widget-title">
          <span className="widget-icon">📰</span>
          News
        </div>
        <span className="widget-meta">via newsdata.io</span>
      </div>

      {/* Tabs */}
      <div className="news-tabs">
        <button
          className={`news-tab ${activeTab === 'us' ? 'active' : ''}`}
          onClick={() => setActiveTab('us')}
        >
          🇺🇸 US News
        </button>
        <button
          className={`news-tab ${activeTab === 'world' ? 'active' : ''}`}
          onClick={() => setActiveTab('world')}
        >
          🌍 World News
        </button>
      </div>

      {/* Articles */}
      <div className="news-list">
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading headlines…</span>
          </div>
        )}

        {!loading && articles.map((article, i) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-item"
          >
            <span className="news-num">{String(i + 1).padStart(2, '0')}</span>
            <div className="news-content">
              <div className="news-headline">{article.headline}</div>
              <div className="news-item-meta">
                <span className="news-source">{article.source}</span>
                <span className="news-time">{article.time}</span>
              </div>
            </div>
            <ExternalLink size={12} className="news-arrow" />
          </a>
        ))}

        {!loading && articles.length === 0 && (
          <div className="empty-state">No articles available</div>
        )}
      </div>
    </div>
  );
}
