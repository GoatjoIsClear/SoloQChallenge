-- ============================================================================
--  LoL Tracker — Supabase schema
--  Run this ONCE in the Supabase SQL editor (Project → SQL → New query).
--  Everything lives in a single Supabase project / database.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
--  players  — the source of truth (replaces data/players.json)
--  summoner_id / account_id are kept (nullable) because the Riot fallback
--  path persists them; they are not part of the public API surface.
-- ---------------------------------------------------------------------------
create table if not exists public.players (
  id              uuid primary key default gen_random_uuid(),
  game_name       text not null,
  tag_line        text not null,
  region          text not null,
  puuid           text,
  summoner_id     text,
  account_id      text,
  profile_icon_id integer,
  summoner_level  integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- prevents adding the same Riot ID + region twice (matches the old in-app check)
create unique index if not exists players_identity_idx
  on public.players (lower(game_name), lower(tag_line), region);

-- ---------------------------------------------------------------------------
--  lp_snapshots — one row per puuid, powers the "+/- LP" column
--  (replaces data/lp_snapshots.json)
-- ---------------------------------------------------------------------------
create table if not exists public.lp_snapshots (
  id                uuid primary key default gen_random_uuid(),
  puuid             text not null unique,
  previous_total_lp integer,
  current_total_lp  integer not null,
  delta_lp          integer,
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  cache — generic key/value store for the ranked + match caches that used
--  to be data/ranked.json and data/matches.json. These rebuild themselves
--  from the Riot API, so this table is purely a performance cache.
--  Keys: "ranked:{playerId}"  and  "matches:{playerId}"
-- ---------------------------------------------------------------------------
create table if not exists public.cache (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ============================================================================
--  Access model
--  The app talks to Supabase ONLY from server-side API routes using the
--  service-role key, so Row Level Security can stay enabled with no public
--  policies (the service role bypasses RLS). Nothing is exposed to browsers.
-- ============================================================================
alter table public.players      enable row level security;
alter table public.lp_snapshots enable row level security;
alter table public.cache        enable row level security;
