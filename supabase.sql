-- ══════════════════════════════════════════════════════════════
-- Le Joueur Mystère — backend du classement (Supabase)
-- À coller tel quel dans : SQL Editor → New query → Run
-- Puis renseigner config.js avec l'URL du projet et la clé « anon ».
-- ══════════════════════════════════════════════════════════════

-- Résultats du mystère du jour (anonymes : jour + nombre d'essais, 0 = raté)
create table if not exists daily_results (
  id bigint generated always as identity primary key,
  day date not null,
  guesses smallint not null check (guesses between 0 and 6),
  created_at timestamptz not null default now()
);

-- Scores du marathon du jour (pseudo + série)
create table if not exists marathon_scores (
  id bigint generated always as identity primary key,
  day date not null,
  pseudo text not null check (char_length(pseudo) between 1 and 20),
  serie smallint not null check (serie between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists idx_daily_day on daily_results (day);
create index if not exists idx_marathon_day on marathon_scores (day, serie desc);

-- RLS : écriture anonyme bornée à aujourd'hui (±1 jour de fuseau), aucune lecture directe
alter table daily_results enable row level security;
alter table marathon_scores enable row level security;

drop policy if exists insert_daily on daily_results;
create policy insert_daily on daily_results
  for insert to anon
  with check (day between current_date - 1 and current_date + 1);

drop policy if exists insert_marathon on marathon_scores;
create policy insert_marathon on marathon_scores
  for insert to anon
  with check (day between current_date - 1 and current_date + 1);

-- Lecture uniquement via ces deux fonctions (agrégats, jamais de lignes brutes)
create or replace function get_daily_stats(d date)
returns json
language sql security definer set search_path = public
as $$
  select json_build_object(
    'plays', count(*),
    'wins',  count(*) filter (where guesses > 0),
    'avg',   round(avg(guesses) filter (where guesses > 0), 1)
  )
  from daily_results
  where day = d;
$$;

create or replace function get_marathon_top(d date)
returns json
language sql security definer set search_path = public
as $$
  select coalesce(json_agg(t), '[]'::json)
  from (
    select pseudo, max(serie) as serie
    from marathon_scores
    where day = d
    group by pseudo
    order by max(serie) desc, min(created_at) asc
    limit 50
  ) t;
$$;

grant execute on function get_daily_stats(date)  to anon;
grant execute on function get_marathon_top(date) to anon;
