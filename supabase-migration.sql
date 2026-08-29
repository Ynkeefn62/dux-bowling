-- Dux Bowling website tables. Already applied to the "duxbowling" project
-- (qqsilzezvuxsdtzaxbzn) on 2026-08-29. Kept here for reference.
create table if not exists public.alley_interest (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_name text not null, email text not null, phone text, role text,
  alley_name text not null, location text, years text,
  duckpin_lanes int, tenpin_lanes int,
  satisfaction int check (satisfaction is null or (satisfaction between 1 and 10)),
  experience text, downtime text, leagues text, third_party text, maintenance text,
  like_dislike text, one_feature text, startup text, meet text, anything_else text
);
alter table public.alley_interest enable row level security;
-- Deliberately no anon policies: only the server (service-role key) reads or writes.

create table if not exists public.bowler_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null, email text not null unique, home_alley text,
  display_name text not null, show_on_board boolean not null default true
);
alter table public.bowler_signups enable row level security;
create index if not exists bowler_signups_board_idx
  on public.bowler_signups (show_on_board, created_at desc);
