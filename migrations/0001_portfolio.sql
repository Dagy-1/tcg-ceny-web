CREATE TABLE IF NOT EXISTS users (
  discord_user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_hash TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'pro')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 999),
  buy_price_czk INTEGER NOT NULL CHECK (buy_price_czk BETWEEN 0 AND 10000000),
  buy_date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (discord_user_id) REFERENCES users(discord_user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_user
  ON portfolio_items(discord_user_id, buy_date DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_product
  ON portfolio_items(product_id);
