-- =============================================================
-- Schéma Comité des Fêtes — à exécuter dans l'éditeur SQL Supabase
-- =============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- =============================================================
-- Tables
-- =============================================================

create table if not exists public.locations (
  id              text primary key,
  nom             text not null,
  evenement       text,
  type            text not null check (type in ('Association', 'Particulier')),
  adherent        text not null check (adherent in ('Oui', 'Non', 'N/A')),
  date_retrait    date not null,
  date_prev_retour date,
  date_retour     date,
  tables          int not null default 0 check (tables >= 0),
  bancs           int not null default 0 check (bancs >= 0),
  tente_marron    int not null default 0 check (tente_marron >= 0),
  tente_blanche   int not null default 0 check (tente_blanche >= 0),
  prix            numeric(10,2) not null default 0,
  is_payed        boolean not null default false,
  etat_retour     text check (etat_retour in ('Bon', 'Endommagé', 'Manquant') or etat_retour is null),
  notes           text,
  created_at      timestamptz not null default now()
);

create table if not exists public.reservations (
  id              text primary key,
  nom             text not null,
  evenement       text,
  type            text not null check (type in ('Association', 'Particulier')),
  adherent        text not null check (adherent in ('Oui', 'Non', 'N/A')),
  date_debut      date not null,
  date_fin        date not null,
  tables          int not null default 0 check (tables >= 0),
  bancs           int not null default 0 check (bancs >= 0),
  tente_marron    int not null default 0 check (tente_marron >= 0),
  tente_blanche   int not null default 0 check (tente_blanche >= 0),
  prix            numeric(10,2) not null default 0,
  notes           text,
  statut          text not null default 'Prévisionnelle'
                  check (statut in ('Prévisionnelle', 'Confirmée')),
  created_at      timestamptz not null default now(),
  check (date_fin >= date_debut)
);

create table if not exists public.reservation_requests (
  id              text primary key default uuid_generate_v4()::text,
  nom             text not null,
  email           text not null,
  telephone       text not null,
  evenement       text,
  type            text not null check (type in ('Association', 'Particulier')),
  adherent        text not null check (adherent in ('Oui', 'Non', 'N/A')),
  date_debut      date not null,
  date_fin        date not null,
  tables          int not null default 0 check (tables >= 0),
  bancs           int not null default 0 check (bancs >= 0),
  tente_marron    int not null default 0 check (tente_marron >= 0),
  tente_blanche   int not null default 0 check (tente_blanche >= 0),
  prix            numeric(10,2) not null default 0,
  notes           text,
  status          text not null default 'pending'
                  check (status in ('pending', 'accepted', 'rejected')),
  created_at      timestamptz not null default now(),
  check (date_fin >= date_debut)
);

-- Index utiles pour la détection de chevauchements
create index if not exists locations_dates_idx on public.locations (date_retrait, date_prev_retour);
create index if not exists reservations_dates_idx on public.reservations (date_debut, date_fin);
create index if not exists reservation_requests_status_idx on public.reservation_requests (status, created_at);

alter table public.locations
  add column if not exists is_payed boolean not null default false;

-- =============================================================
-- Row Level Security
-- App mono-utilisateur : tout utilisateur authentifié a accès complet,
-- les anonymes n'ont aucun droit.
-- =============================================================

alter table public.locations    enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_requests enable row level security;

drop policy if exists "auth full access" on public.locations;
create policy "auth full access" on public.locations
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "auth full access" on public.reservations;
create policy "auth full access" on public.reservations
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "auth full access" on public.reservation_requests;
create policy "auth full access" on public.reservation_requests
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "anon can create pending requests" on public.reservation_requests;
create policy "anon can create pending requests" on public.reservation_requests
  for insert
  to anon
  with check (status = 'pending');
