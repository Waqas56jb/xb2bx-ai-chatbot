-- ============================================================
-- XB2BX Assistant — Supabase / Postgres schema
-- Run this once in the Supabase SQL editor (or psql) to create the database.
-- Settings and knowledge (training) rows are auto-seeded by the server on first
-- boot from code defaults, so you only need to run the table definitions here.
-- Sample suppliers/products are included so search works immediately.
-- ============================================================

-- ---------- Supplier directory ----------
create table if not exists suppliers (
  id               text primary key,
  name             text not null,
  country          text not null default '',
  categories       text not null default '',
  keywords         text not null default '',
  description      text not null default '',
  monthly_capacity integer not null default 0,
  min_order_qty    integer not null default 0,
  verified         integer not null default 0,
  responsiveness   numeric not null default 0,
  rating           numeric not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists idx_suppliers_country  on suppliers(country);
create index if not exists idx_suppliers_verified on suppliers(verified);

-- ---------- Product catalogue ----------
create table if not exists products (
  id          text primary key,
  title       text not null,
  category    text not null default '',
  description text not null default '',
  keywords    text not null default '',
  moq         integer not null default 0,
  price       text not null default '',
  supplier_id text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_products_category on products(category);

-- ---------- Leads ----------
create table if not exists leads (
  id         text primary key,
  name       text not null default '',
  email      text not null default '',
  interest   text not null default '',
  volume     text not null default '',
  budget     text not null default '',
  location   text not null default '',
  timeline   text not null default '',
  score      integer not null default 0,
  tier       text not null default 'cold',
  qualified  integer not null default 0,
  status     text not null default 'new',
  created_at timestamptz not null default now()
);
create index if not exists idx_leads_tier   on leads(tier);
create index if not exists idx_leads_status on leads(status);

-- ---------- Conversations + messages ----------
create table if not exists conversations (
  id            text primary key,
  session_id    text not null default '',
  channel       text not null default 'web',
  agent         text not null default '',
  status        text not null default 'open',
  message_count integer not null default 0,
  last_message  text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_conversations_session on conversations(session_id);
create index if not exists idx_conversations_updated on conversations(updated_at desc);

create table if not exists messages (
  id              bigint generated always as identity primary key,
  conversation_id text not null,
  role            text not null,
  agent           text not null default '',
  content         text not null default '',
  created_at      timestamptz not null default now()
);
create index if not exists idx_messages_conversation on messages(conversation_id);

-- ---------- RFQs ----------
create table if not exists rfqs (
  id                text primary key,
  product           text not null default '',
  quantity          integer not null default 0,
  target_country    text not null default '',
  delivery_timeline text not null default '',
  contact_email     text not null default '',
  notes             text not null default '',
  status            text not null default 'created',
  created_at        timestamptz not null default now()
);

-- ---------- Seller listings ----------
create table if not exists listings (
  id           text primary key,
  title        text not null default '',
  category     text not null default '',
  description  text not null default '',
  price        text not null default '',
  seller_email text not null default '',
  status       text not null default 'draft',
  created_at   timestamptz not null default now()
);

-- ---------- Support tickets ----------
create table if not exists support_tickets (
  id            text primary key,
  subject       text not null default '',
  description   text not null default '',
  contact_email text not null default '',
  priority      text not null default 'normal',
  status        text not null default 'open',
  created_at    timestamptz not null default now()
);

-- ---------- Escalations ----------
create table if not exists escalations (
  id            text primary key,
  reason        text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  status        text not null default 'queued',
  created_at    timestamptz not null default now()
);

-- ---------- Settings (admin-controlled chatbot config) ----------
create table if not exists settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

-- ---------- Knowledge / training ----------
create table if not exists knowledge (
  key        text primary key,
  title      text not null default '',
  content    text not null default '',
  enabled    boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Sample data (suppliers + products) so search works immediately.
-- Safe to re-run (on conflict do nothing).
-- ============================================================
insert into suppliers (id, name, country, categories, keywords, description, monthly_capacity, min_order_qty, verified, responsiveness, rating) values
 ('SUP-1042','GreenPack Industries','Vietnam','packaging,eco','eco-friendly packaging biodegradable mailer boxes recyclable','Sustainable packaging manufacturer specialising in biodegradable mailers and recyclable boxes.',500000,5000,1,0.92,4.7),
 ('SUP-0876','EcoForm Manufacturing','India','packaging,eco','compostable packaging paper pulp trays moulded fibre','Moulded-fibre and compostable packaging for food and retail.',250000,2000,1,0.85,4.4),
 ('SUP-1190','NordPackaging','Poland','packaging','cardboard boxes corrugated packaging printed','Corrugated and printed cardboard packaging for European supply chains.',180000,1000,1,0.78,4.2),
 ('SUP-1330','Saigon Furnishings','Vietnam','furniture,wood','furniture wooden chairs tables solid wood rattan','Solid-wood and rattan furniture manufacturer for hospitality and retail.',40000,200,1,0.81,4.6),
 ('SUP-1455','Hanoi WoodCraft','Vietnam','furniture,wood','furniture cabinets desks plywood veneer','Cabinetry and office furniture, plywood and veneer specialists.',30000,100,0,0.66,4.1),
 ('SUP-1501','TextilePro Lahore','Pakistan','textiles','textiles cotton fabric woven garments t-shirts','Woven cotton textiles and garment production at scale.',800000,10000,1,0.88,4.5),
 ('SUP-1622','Istanbul Knits','Turkey','textiles','textiles knitwear jersey organic cotton apparel','Knitwear and jersey apparel, organic cotton options.',350000,3000,1,0.83,4.3),
 ('SUP-1709','Shenzhen ElectroParts','China','electronics','electronics pcb components connectors assembly','PCB assembly and electronic components for OEMs.',1000000,5000,1,0.90,4.4),
 ('SUP-1810','Guangzhou LED Co','China','electronics,lighting','led lighting fixtures bulbs smart lighting','LED lighting fixtures and smart-lighting modules.',600000,2000,1,0.76,4.0),
 ('SUP-1925','AndesOrganics','Peru','food,eco','organic food quinoa cacao superfoods bulk','Bulk organic superfoods — quinoa, cacao, and more.',120000,500,1,0.79,4.6),
 ('SUP-2044','Cairo Packaging Group','Egypt','packaging','plastic packaging containers bottles caps','Rigid plastic containers, bottles, and closures.',400000,5000,0,0.60,3.9),
 ('SUP-2160','BalticWood Interiors','Lithuania','furniture,wood','furniture oak tables chairs flat-pack','Oak and flat-pack furniture for European retailers.',25000,150,1,0.84,4.5)
on conflict (id) do nothing;

insert into products (id, title, category, description, keywords, moq, price, supplier_id) values
 ('PRD-301','Recyclable Mailer Box','packaging','Curbside-recyclable corrugated mailer box, custom print available.','mailer box recyclable corrugated shipping',1000,'from $0.18/unit','SUP-1042'),
 ('PRD-302','Biodegradable Poly Mailer','packaging','Compostable mailer bag made from plant-based film.','biodegradable mailer compostable bag eco',2000,'from $0.09/unit','SUP-1042'),
 ('PRD-303','Moulded Fibre Tray','packaging','Compostable moulded-fibre tray for food and retail packaging.','moulded fibre tray compostable food packaging',5000,'from $0.06/unit','SUP-0876'),
 ('PRD-310','Organic Cotton T-Shirt (Blank)','textiles','Blank organic cotton tee for private-label apparel.','organic cotton t-shirt blank apparel garment',500,'from $2.40/unit','SUP-1622'),
 ('PRD-311','Woven Cotton Fabric Roll','textiles','Woven cotton fabric by the roll for garment manufacturing.','woven cotton fabric roll textile',1000,'from $1.10/metre','SUP-1501'),
 ('PRD-320','Solid Wood Dining Chair','furniture','Solid-wood dining chair for hospitality and retail.','solid wood dining chair furniture hospitality',100,'from $18/unit','SUP-1330'),
 ('PRD-321','Flat-Pack Oak Table','furniture','Flat-pack oak dining table for European retailers.','flat-pack oak table furniture dining',50,'from $46/unit','SUP-2160'),
 ('PRD-330','Smart LED Panel Light','electronics','Dimmable smart LED panel with app control.','led panel smart lighting dimmable fixture',200,'from $7.50/unit','SUP-1810'),
 ('PRD-331','Custom PCB Assembly','electronics','Turnkey PCB assembly for OEM electronics.','pcb assembly electronics oem components',100,'quote on spec','SUP-1709'),
 ('PRD-340','Organic Quinoa (Bulk)','food','Bulk organic white quinoa, export-grade.','organic quinoa bulk superfood food',500,'from $2.80/kg','SUP-1925')
on conflict (id) do nothing;
