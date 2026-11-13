-- StayLedger schema. Safe to run repeatedly.
CREATE TABLE IF NOT EXISTS hotels (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(120)  NOT NULL,
  description TEXT          NOT NULL,
  latitude    NUMERIC(9, 6) NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude   NUMERIC(9, 6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  price       NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  image_path  TEXT          NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hotels_price_idx   ON hotels (price);
CREATE INDEX IF NOT EXISTS hotels_created_idx ON hotels (created_at DESC, id DESC);
