-- Migration 002 : Tables et colonnes manquantes
-- À appliquer via le dashboard Supabase → SQL Editor

-- ============================================================
-- COLONNES MANQUANTES : restaurants
-- ============================================================
alter table public.restaurants
  add column if not exists description        text,
  add column if not exists cover_url          text,
  add column if not exists accent_color       text default '#5B21B6',
  add column if not exists points_expiry_months integer,
  add column if not exists mad_per_point      integer not null default 10;

-- ============================================================
-- COLONNE MANQUANTE : clients
-- ============================================================
alter table public.clients
  add column if not exists password_hash text;

-- ============================================================
-- COLONNES MANQUANTES : visits
-- ============================================================
alter table public.visits
  add column if not exists expires_at     timestamptz,
  add column if not exists points_expired boolean not null default false;

-- Index pour les visites non expirées à requêter
create index if not exists idx_visits_expires_at
  on public.visits(expires_at)
  where expires_at is not null;

-- ============================================================
-- TABLE : qr_tokens
-- ============================================================
create table if not exists public.qr_tokens (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  amount        numeric(10, 2) not null,
  used_at       timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.qr_tokens enable row level security;

-- Les tokens sont créés et lus côté serveur (service_role) — aucune policy publique nécessaire
create policy "Service role gère les tokens"
  on public.qr_tokens for all
  using (true)
  with check (true);

create index if not exists idx_qr_tokens_restaurant_id on public.qr_tokens(restaurant_id);
create index if not exists idx_qr_tokens_created_at    on public.qr_tokens(created_at);

-- ============================================================
-- TABLE : staff
-- ============================================================
create table if not exists public.staff (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name          text not null,
  role          text not null default 'server',
  password_hash text,
  created_at    timestamptz not null default now(),
  unique(restaurant_id, name)
);

alter table public.staff enable row level security;

create policy "Propriétaire gère son staff"
  on public.staff for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create index if not exists idx_staff_restaurant_id on public.staff(restaurant_id);

-- ============================================================
-- TABLE : leads (demandes de démo depuis la landing page)
-- ============================================================
create table if not exists public.leads (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  email      text not null,
  phone      text not null,
  location   text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Insertion publique (formulaire landing page), lecture admin seulement
create policy "Insertion publique leads"
  on public.leads for insert
  with check (true);

-- ============================================================
-- TABLE : redemption_requests
-- ============================================================
create table if not exists public.redemption_requests (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  reward_id     uuid not null references public.rewards(id) on delete cascade,
  reward_name   text not null,
  reward_points integer not null,
  client_name   text,
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'rejected')),
  created_at    timestamptz not null default now()
);

alter table public.redemption_requests enable row level security;

create policy "Propriétaire gère ses demandes de remboursement"
  on public.redemption_requests for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

-- Insertion publique pour les clients (non authentifiés Supabase)
create policy "Client peut créer une demande"
  on public.redemption_requests for insert
  with check (true);

create index if not exists idx_redemption_restaurant_id on public.redemption_requests(restaurant_id);
create index if not exists idx_redemption_client_id     on public.redemption_requests(client_id);
create index if not exists idx_redemption_status        on public.redemption_requests(status);

-- ============================================================
-- COLONNES MANQUANTES : rewards
-- (la migration 001 crée is_active et points_required — vérification)
-- ============================================================
-- Ces colonnes existent déjà si la migration 001 a été appliquée.
-- Si ce n'est pas le cas (colonnes 'active' et 'points_cost' à la place), exécuter :
-- alter table public.rewards rename column active to is_active;
-- alter table public.rewards rename column points_cost to points_required;
