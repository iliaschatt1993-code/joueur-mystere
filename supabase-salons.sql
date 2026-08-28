-- ══════════════════════════════════════════════════════════════
-- Le Joueur Mystère — salons privés entre amis (v9.6)
-- À coller tel quel dans : Supabase → SQL Editor → New query → Run
-- (s'ajoute au supabase.sql déjà exécuté, ne touche à rien d'existant)
-- ══════════════════════════════════════════════════════════════

create table if not exists salons (
  code text primary key check (code ~ '^[A-Z0-9]{6}$'),
  nom text not null check (char_length(nom) between 1 and 30),
  created_at timestamptz not null default now()
);

create table if not exists salon_membres (
  id bigint generated always as identity primary key,
  salon_code text not null references salons(code) on delete cascade,
  uid text not null check (char_length(uid) between 8 and 40),
  pseudo text not null check (char_length(pseudo) between 1 and 20),
  maillot smallint not null default 10 check (maillot between 1 and 99),
  couleur smallint not null default 0 check (couleur between 0 and 7),
  joined_at timestamptz not null default now(),
  unique (salon_code, uid)
);

create table if not exists salon_scores (
  id bigint generated always as identity primary key,
  salon_code text not null references salons(code) on delete cascade,
  uid text not null,
  day date not null,
  serie smallint not null check (serie between 0 and 300),
  created_at timestamptz not null default now(),
  unique (salon_code, uid, day)
);

create index if not exists idx_salon_scores on salon_scores (salon_code, day);

-- Tables verrouillées : tout passe par les fonctions ci-dessous (security definer)
alter table salons enable row level security;
alter table salon_membres enable row level security;
alter table salon_scores enable row level security;

-- Créer un salon : génère le code côté serveur, inscrit le créateur, renvoie le code
create or replace function salon_creer(p_nom text, p_uid text, p_pseudo text, p_maillot int, p_couleur int)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_code text;
  v_essais int := 0;
  v_alpha text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- sans O/0/I/1 (ambigus à l'oral)
begin
  if char_length(trim(p_nom)) not between 1 and 30 then raise exception 'nom invalide'; end if;
  loop
    v_code := '';
    while char_length(v_code) < 6 loop
      v_code := v_code || substr(v_alpha, 1 + floor(random() * 32)::int, 1);
    end loop;
    begin
      insert into salons (code, nom) values (v_code, trim(p_nom));
      exit;
    exception when unique_violation then
      v_essais := v_essais + 1;
      if v_essais > 5 then raise; end if;
    end;
  end loop;
  perform salon_rejoindre(v_code, p_uid, p_pseudo, p_maillot, p_couleur);
  return v_code;
end;
$$;

-- Rejoindre (ou mettre à jour son pseudo/avatar) — renvoie le nom du salon
create or replace function salon_rejoindre(p_code text, p_uid text, p_pseudo text, p_maillot int, p_couleur int)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_nom text;
  v_n int;
begin
  select nom into v_nom from salons where code = upper(p_code);
  if v_nom is null then raise exception 'salon inconnu'; end if;
  select count(*) into v_n from salon_membres where salon_code = upper(p_code);
  if v_n >= 30 then raise exception 'salon plein'; end if;
  insert into salon_membres (salon_code, uid, pseudo, maillot, couleur)
  values (upper(p_code), p_uid, p_pseudo, coalesce(p_maillot, 10), coalesce(p_couleur, 0))
  on conflict (salon_code, uid)
  do update set pseudo = excluded.pseudo, maillot = excluded.maillot, couleur = excluded.couleur;
  return v_nom;
end;
$$;

-- Publier son score du marathon classé du jour (upsert, on garde le meilleur)
create or replace function salon_score(p_code text, p_uid text, p_day date, p_serie int)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_day not between current_date - 1 and current_date + 1 then raise exception 'jour invalide'; end if;
  if not exists (select 1 from salon_membres where salon_code = upper(p_code) and uid = p_uid) then
    raise exception 'pas membre';
  end if;
  insert into salon_scores (salon_code, uid, day, serie)
  values (upper(p_code), p_uid, p_day, p_serie)
  on conflict (salon_code, uid, day)
  do update set serie = greatest(salon_scores.serie, excluded.serie);
end;
$$;

-- Tableau du salon : membres + classement du jour + classement général
create or replace function get_salon(p_code text, p_day date)
returns json
language sql security definer set search_path = public
as $$
  select json_build_object(
    'nom', (select nom from salons where code = upper(p_code)),
    'membres', (
      select coalesce(json_agg(json_build_object(
        'pseudo', m.pseudo, 'maillot', m.maillot, 'couleur', m.couleur,
        'jour', (select s.serie from salon_scores s where s.salon_code = m.salon_code and s.uid = m.uid and s.day = p_day),
        'total', coalesce((select sum(s.serie) from salon_scores s where s.salon_code = m.salon_code and s.uid = m.uid), 0),
        'jours', (select count(*) from salon_scores s where s.salon_code = m.salon_code and s.uid = m.uid)
      ) order by coalesce((select sum(s.serie) from salon_scores s where s.salon_code = m.salon_code and s.uid = m.uid), 0) desc), '[]'::json)
      from salon_membres m where m.salon_code = upper(p_code)
    )
  );
$$;

grant execute on function salon_creer(text, text, text, int, int) to anon;
grant execute on function salon_rejoindre(text, text, text, int, int) to anon;
grant execute on function salon_score(text, text, date, int) to anon;
grant execute on function get_salon(text, date) to anon;
