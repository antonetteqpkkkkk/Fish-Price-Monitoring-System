-- IsdaPresyo (Bulan, Sorsogon) database schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS fish_prices (
  id SERIAL PRIMARY KEY,
  fish_type VARCHAR(100) NOT NULL,
  min_price DECIMAL(10,2) NOT NULL,
  max_price DECIMAL(10,2) NOT NULL,
  avg_price DECIMAL(10,2) NOT NULL,
  date_updated DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_fish_prices_type_date
  ON fish_prices (fish_type, date_updated DESC, id DESC);

CREATE TABLE IF NOT EXISTS admin (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
