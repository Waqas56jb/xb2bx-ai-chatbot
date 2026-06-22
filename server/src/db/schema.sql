-- XB2BX Assistant database schema
-- Written for SQLite; portable to Postgres/MySQL with minor type tweaks
-- (INTEGER 0/1 -> BOOLEAN, REAL -> NUMERIC, datetime('now') -> now()).
-- The repositories are the only code that touch these tables, so migrating
-- engines (e.g. to Supabase/Postgres) is a per-repository change.

-- ---------- Supplier directory ----------
CREATE TABLE IF NOT EXISTS suppliers (
  id               TEXT PRIMARY KEY,           -- e.g. 'SUP-1042'
  name             TEXT NOT NULL,
  country          TEXT NOT NULL,
  categories       TEXT NOT NULL DEFAULT '',   -- comma-separated slugs, e.g. 'packaging,eco'
  keywords         TEXT NOT NULL DEFAULT '',   -- searchable product terms
  description      TEXT NOT NULL DEFAULT '',
  monthly_capacity INTEGER NOT NULL DEFAULT 0, -- units producible per month
  min_order_qty    INTEGER NOT NULL DEFAULT 0,
  verified         INTEGER NOT NULL DEFAULT 0, -- 0 = no, 1 = yes
  responsiveness   REAL    NOT NULL DEFAULT 0, -- 0..1 historical reply speed
  rating           REAL    NOT NULL DEFAULT 0, -- 0..5 buyer rating
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_suppliers_country  ON suppliers(country);
CREATE INDEX IF NOT EXISTS idx_suppliers_verified ON suppliers(verified);

-- ---------- Product catalogue ----------
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,                -- e.g. 'PRD-301'
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  keywords    TEXT NOT NULL DEFAULT '',
  moq         INTEGER NOT NULL DEFAULT 0,      -- minimum order quantity
  price       TEXT NOT NULL DEFAULT '',        -- free-form, e.g. 'from $0.12/unit'
  supplier_id TEXT,                            -- optional FK to suppliers.id
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ---------- Leads (revenue capture) ----------
CREATE TABLE IF NOT EXISTS leads (
  id          TEXT PRIMARY KEY,                -- e.g. 'LEAD-1718...'
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  interest    TEXT NOT NULL,
  volume      TEXT NOT NULL DEFAULT '',
  budget      TEXT NOT NULL DEFAULT '',
  location    TEXT NOT NULL DEFAULT '',
  timeline    TEXT NOT NULL DEFAULT '',
  score       INTEGER NOT NULL DEFAULT 0,      -- 0..100
  tier        TEXT NOT NULL DEFAULT 'cold',    -- hot | warm | cold
  qualified   INTEGER NOT NULL DEFAULT 0,      -- 0/1
  status      TEXT NOT NULL DEFAULT 'new',     -- new | contacted | converted | lost
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_leads_tier   ON leads(tier);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- ---------- Conversations + messages (for the admin dashboard) ----------
CREATE TABLE IF NOT EXISTS conversations (
  id            TEXT PRIMARY KEY,              -- e.g. 'CONV-1718...'
  session_id    TEXT NOT NULL DEFAULT '',      -- client-supplied session/browser id
  channel       TEXT NOT NULL DEFAULT 'web',
  agent         TEXT NOT NULL DEFAULT '',      -- last agent that replied
  status        TEXT NOT NULL DEFAULT 'open',  -- open | closed
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message  TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at);

CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  role            TEXT NOT NULL,               -- user | assistant
  agent           TEXT NOT NULL DEFAULT '',
  content         TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- ---------- RFQs ----------
CREATE TABLE IF NOT EXISTS rfqs (
  id                TEXT PRIMARY KEY,           -- e.g. 'RFQ-1718...'
  product           TEXT NOT NULL,
  quantity          INTEGER NOT NULL DEFAULT 0,
  target_country    TEXT NOT NULL DEFAULT '',
  delivery_timeline TEXT NOT NULL DEFAULT '',
  contact_email     TEXT NOT NULL DEFAULT '',
  notes             TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'created', -- created | sent | quoted | closed
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);

-- ---------- Seller listings (drafted by the assistant) ----------
CREATE TABLE IF NOT EXISTS listings (
  id           TEXT PRIMARY KEY,               -- e.g. 'LST-1718...'
  title        TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  price        TEXT NOT NULL DEFAULT '',
  seller_email TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'draft',  -- draft | published
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- Support tickets ----------
CREATE TABLE IF NOT EXISTS support_tickets (
  id            TEXT PRIMARY KEY,              -- e.g. 'TKT-1718...'
  subject       TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  priority      TEXT NOT NULL DEFAULT 'normal',-- low | normal | high
  status        TEXT NOT NULL DEFAULT 'open',  -- open | pending | resolved
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

-- ---------- Human-handoff escalations ----------
CREATE TABLE IF NOT EXISTS escalations (
  id            TEXT PRIMARY KEY,              -- e.g. 'ESC-1718...'
  reason        TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'queued',-- queued | handled
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
