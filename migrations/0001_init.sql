-- D1 schema for the Cloudflare Workers deployment.
CREATE TABLE IF NOT EXISTS subscribers (email TEXT PRIMARY KEY, consent INTEGER NOT NULL, created_at TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'homepage');
CREATE TABLE IF NOT EXISTS provider_signals (id INTEGER PRIMARY KEY AUTOINCREMENT, provider_id TEXT NOT NULL, source TEXT NOT NULL, delta INTEGER NOT NULL, summary TEXT NOT NULL DEFAULT '', items TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_signals_provider ON provider_signals(provider_id, created_at DESC);
CREATE TABLE IF NOT EXISTS provider_state (provider_id TEXT PRIMARY KEY, tweet_delta INTEGER NOT NULL DEFAULT 0, news_delta INTEGER NOT NULL DEFAULT 0, blog_delta INTEGER NOT NULL DEFAULT 0, summary TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS seen_posts (provider_id TEXT NOT NULL, url TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', published_at TEXT NOT NULL DEFAULT '', first_seen_at TEXT NOT NULL, PRIMARY KEY (provider_id, url));
