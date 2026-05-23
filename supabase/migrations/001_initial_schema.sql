-- Migration 001 : Schéma initial Taghra
-- Activer l'extension UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE : restaurants
-- ============================================================
create table public.restaurants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  phone text,
  logo_url text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.restaurants enable row level security;

create policy "Propriétaire voit son restaurant"
  on public.restaurants for select
  using (auth.uid() = owner_id);

create policy "Propriétaire modifie son restaurant"
  on public.restaurants for update
  using (auth.uid() = owner_id);

create policy "Inscription crée son restaurant"
  on public.restaurants for insert
  with check (auth.uid() = owner_id);

-- ============================================================
-- TABLE : clients
-- ============================================================
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  phone text not null,
  whatsapp_confirmed boolean not null default false,
  points_balance integer not null default 0,
  total_visits integer not null default 0,
  total_spent numeric(10, 2) not null default 0,
  birthday date,
  last_visit_at timestamptz,
  created_at timestamptz not null default now(),
  unique(restaurant_id, phone)
);

alter table public.clients enable row level security;

create policy "Propriétaire voit ses clients"
  on public.clients for select
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "Propriétaire modifie ses clients"
  on public.clients for update
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "Inscription publique client"
  on public.clients for insert
  with check (true);

-- ============================================================
-- TABLE : visits
-- ============================================================
create table public.visits (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  amount_paid numeric(10, 2) not null default 0,
  points_earned integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.visits enable row level security;

create policy "Propriétaire voit les visites"
  on public.visits for select
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "Propriétaire insère des visites"
  on public.visits for insert
  with check (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

-- ============================================================
-- TABLE : rewards
-- ============================================================
create table public.rewards (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  points_required integer not null,
  discount_percent integer not null check (discount_percent between 1 and 100),
  expires_in_days integer not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.rewards enable row level security;

create policy "Propriétaire gère ses récompenses"
  on public.rewards for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

-- ============================================================
-- TABLE : campaigns
-- ============================================================
create type campaign_trigger_type as enum (
  'birthday', 'inactive', 'welcome', 'manual', 'points_milestone'
);

create type campaign_status as enum (
  'draft', 'active', 'paused', 'completed'
);

create type client_segment as enum (
  'all', 'vip', 'inactive', 'new'
);

create table public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  message text not null,
  segment client_segment not null default 'all',
  trigger_type campaign_trigger_type not null,
  trigger_value text,
  status campaign_status not null default 'draft',
  sent_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;

create policy "Propriétaire gère ses campagnes"
  on public.campaigns for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

-- ============================================================
-- TABLE : campaign_logs
-- ============================================================
create type message_status as enum ('sent', 'delivered', 'failed');

create table public.campaign_logs (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  sent_at timestamptz not null default now(),
  status message_status not null default 'sent'
);

alter table public.campaign_logs enable row level security;

create policy "Propriétaire voit les logs"
  on public.campaign_logs for select
  using (
    exists (
      select 1 from public.campaigns c
      join public.restaurants r on r.id = c.restaurant_id
      where c.id = campaign_id and r.owner_id = auth.uid()
    )
  );

create policy "Propriétaire insère des logs"
  on public.campaign_logs for insert
  with check (true);

-- ============================================================
-- TABLE : points_rules
-- ============================================================
create table public.points_rules (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  points_per_100mad integer not null default 10,
  welcome_bonus integer not null default 50,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(restaurant_id)
);

alter table public.points_rules enable row level security;

create policy "Propriétaire gère ses règles"
  on public.points_rules for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

-- ============================================================
-- INDEX pour les performances
-- ============================================================
create index idx_clients_restaurant_id on public.clients(restaurant_id);
create index idx_clients_phone on public.clients(phone);
create index idx_visits_client_id on public.visits(client_id);
create index idx_visits_restaurant_id on public.visits(restaurant_id);
create index idx_visits_created_at on public.visits(created_at);
create index idx_campaigns_restaurant_id on public.campaigns(restaurant_id);
create index idx_campaign_logs_campaign_id on public.campaign_logs(campaign_id);

-- ============================================================
-- FONCTION : créer profil restaurant après inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Ne rien faire ici, le restaurant est créé côté app
  return new;
end;
$$ language plpgsql security definer;
