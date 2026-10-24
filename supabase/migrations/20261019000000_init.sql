-- =====================================================================
-- Avalie Bolados — schema inicial
-- Tudo com RLS. XP, Brasas, notas e compras só mudam por funções
-- security definer: o cliente nunca escreve esses valores direto.
-- =====================================================================

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.bolado_type as enum ('tabaco', 'beck');
create type public.roda_role   as enum ('owner', 'admin', 'member');
create type public.media_kind  as enum ('photo', 'video', 'link');
create type public.airflow     as enum ('leve', 'ideal', 'pesado');
create type public.shop_kind   as enum ('theme', 'frame', 'title');

-- Data "de hoje" no fuso de Brasília (streak, teto diário de XP)
create or replace function public.today_br()
returns date language sql stable set search_path = '' as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

-- ---------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  username         extensions.citext not null unique
                   check (username ~ '^[a-z0-9_.]{3,20}$'),
  display_name     text not null check (char_length(display_name) between 1 and 40),
  avatar_path      text,
  bio              text check (char_length(bio) <= 160),
  birthdate        date not null,
  is_public        boolean not null default false,
  xp               integer not null default 0 check (xp >= 0),
  level            integer not null default 1 check (level >= 1),
  brasas           integer not null default 0 check (brasas >= 0),
  active_theme     text not null default 'ouro',
  active_frame     text,
  active_title     text,
  last_active_date date,
  streak           integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.consents (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('terms', 'privacy', 'sensitive_data')),
  version    text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index consents_user_idx on public.consents (user_id);

-- ---------------------------------------------------------------------
-- Rodas (grupos)
-- ---------------------------------------------------------------------
create table public.rodas (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 40),
  description text check (char_length(description) <= 280),
  invite_code text not null unique
              default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  owner_id    uuid not null references public.profiles (id),
  weights     jsonb,
  created_at  timestamptz not null default now()
);

create table public.roda_members (
  roda_id   uuid not null references public.rodas (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      public.roda_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (roda_id, user_id)
);
create index roda_members_user_idx on public.roda_members (user_id);

-- ---------------------------------------------------------------------
-- Critérios do checklist (dados de referência)
-- ---------------------------------------------------------------------
create table public.criteria (
  key         text primary key,
  phase       text not null check (phase in ('pre', 'pos')),
  label       text not null,
  description text not null,
  weight      numeric(3,1) not null check (weight between 0 and 3),
  optional    boolean not null default false,
  sort        integer not null,
  checklist   jsonb not null default '[]'
);

-- ---------------------------------------------------------------------
-- Bolados, mídia e avaliações
-- ---------------------------------------------------------------------
create table public.bolados (
  id                uuid primary key default gen_random_uuid(),
  roda_id           uuid not null references public.rodas (id) on delete cascade,
  roller_id         uuid not null references public.profiles (id) on delete cascade,
  created_by        uuid references public.profiles (id) on delete set null,
  type              public.bolado_type not null,
  rolled_at         timestamptz not null default now(),
  paper             text check (char_length(paper) <= 60),
  filter            text check (char_length(filter) <= 60),
  notes             text check (char_length(notes) <= 500),
  final_score       numeric(4,2),
  evaluations_count integer not null default 0,
  created_at        timestamptz not null default now()
);
create index bolados_roda_idx   on public.bolados (roda_id, rolled_at desc);
create index bolados_roller_idx on public.bolados (roller_id, rolled_at desc);

create table public.bolado_media (
  id           uuid primary key default gen_random_uuid(),
  bolado_id    uuid not null references public.bolados (id) on delete cascade,
  roda_id      uuid not null references public.rodas (id) on delete cascade,
  uploader_id  uuid not null references public.profiles (id) on delete cascade,
  kind         public.media_kind not null,
  storage_path text,
  url          text check (url ~ '^https://'),
  caption      text check (char_length(caption) <= 140),
  created_at   timestamptz not null default now(),
  check ((kind = 'link' and url is not null) or (kind <> 'link' and storage_path is not null))
);
create index bolado_media_bolado_idx on public.bolado_media (bolado_id);
create index bolado_media_uploader_idx on public.bolado_media (uploader_id);

create table public.evaluations (
  id           uuid primary key default gen_random_uuid(),
  bolado_id    uuid not null references public.bolados (id) on delete cascade,
  evaluator_id uuid not null references public.profiles (id) on delete cascade,
  total        numeric(4,2) not null,
  feedback     text check (char_length(feedback) <= 1000),
  airflow      public.airflow,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (bolado_id, evaluator_id)
);
create index evaluations_evaluator_idx on public.evaluations (evaluator_id);

create table public.evaluation_scores (
  evaluation_id uuid not null references public.evaluations (id) on delete cascade,
  criterion_key text not null references public.criteria (key),
  score         numeric(3,1) not null check (score between 0 and 10 and score * 2 = floor(score * 2)),
  checklist     jsonb not null default '[]',
  primary key (evaluation_id, criterion_key)
);

-- ---------------------------------------------------------------------
-- Gamificação
-- ---------------------------------------------------------------------
create table public.xp_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null,
  xp         integer not null default 0,
  brasas     integer not null default 0,
  ref_id     uuid,
  created_at timestamptz not null default now()
);
create index xp_events_user_idx on public.xp_events (user_id, created_at desc);

create table public.badges (
  key           text primary key,
  name          text not null,
  description   text not null,
  icon          text not null,
  rarity        text not null check (rarity in ('comum', 'rara', 'epica', 'lendaria')),
  reward_brasas integer not null default 0,
  sort          integer not null default 0
);

create table public.user_badges (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  badge_key  text not null references public.badges (key),
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_key)
);

create table public.shop_items (
  key         text primary key,
  kind        public.shop_kind not null,
  name        text not null,
  description text not null,
  price       integer not null check (price >= 0),
  min_level   integer not null default 1,
  data        jsonb not null default '{}',
  sort        integer not null default 0
);

create table public.user_items (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  item_key    text not null references public.shop_items (key),
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

-- =====================================================================
-- Helpers de autorização (security definer evita recursão de RLS)
-- =====================================================================
create or replace function public.is_roda_member(p_roda uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.roda_members
    where roda_id = p_roda and user_id = (select auth.uid())
  )
$$;

create or replace function public.is_roda_admin(p_roda uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.roda_members
    where roda_id = p_roda and user_id = (select auth.uid()) and role in ('owner', 'admin')
  )
$$;

create or replace function public.shares_roda(p_other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.roda_members a
    join public.roda_members b on b.roda_id = a.roda_id
    where a.user_id = (select auth.uid()) and b.user_id = p_other
  )
$$;

create or replace function public.can_view_profile(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_user = (select auth.uid())
      or exists (select 1 from public.profiles where id = p_user and is_public)
      or public.shares_roda(p_user)
$$;

create or replace function public.level_for_xp(p_xp integer)
returns integer language sql immutable set search_path = '' as $$
  -- XP acumulado para o nível n = 100 * (n-1)^1.5
  select greatest(1, floor(power(greatest(p_xp, 0) / 100.0, 2.0 / 3.0) + 1e-9)::int + 1)
$$;

-- =====================================================================
-- Triggers de manutenção
-- =====================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Novo usuário do Auth -> perfil + consentimentos (metadados do cadastro)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_birth date;
  v_version text := coalesce(meta ->> 'consent_version', '2026-10-19');
begin
  v_birth := (meta ->> 'birthdate')::date;
  if v_birth is null or v_birth > (public.today_br() - interval '18 years')::date then
    raise exception 'O Avalie Bolados é só para maiores de 18 anos.';
  end if;

  -- Bônus de boas-vindas: 50 Brasas para estrear a loja
  insert into public.profiles (id, username, display_name, birthdate, brasas)
  values (
    new.id,
    lower(meta ->> 'username'),
    coalesce(nullif(trim(meta ->> 'display_name'), ''), meta ->> 'username'),
    v_birth,
    50
  );
  insert into public.xp_events (user_id, kind, xp, brasas) values (new.id, 'welcome', 0, 50);

  insert into public.consents (user_id, kind, version)
  select new.id, k, v_version
  from unnest(array['terms', 'privacy', 'sensitive_data']) as k
  where coalesce((meta ->> ('consent_' || k))::boolean, false);

  -- Tema padrão é de graça e já vem na conta
  insert into public.user_items (user_id, item_key) values (new.id, 'theme_ouro')
  on conflict do nothing;

  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Valida idade também em updates do perfil
create or replace function public.check_profile_age()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.birthdate > (public.today_br() - interval '18 years')::date then
    raise exception 'O Avalie Bolados é só para maiores de 18 anos.';
  end if;
  return new;
end $$;

create trigger profiles_age before update of birthdate on public.profiles
  for each row execute function public.check_profile_age();

-- Quem cria a roda entra como dono
create or replace function public.handle_new_roda()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.roda_members (roda_id, user_id, role) values (new.id, new.owner_id, 'owner');
  perform public.award(new.owner_id, 'roda_created', 10, 5, new.id);
  return new;
end $$;

-- Pesos customizados da roda: só critérios conhecidos, de 0 a 3
create or replace function public.validate_roda_weights()
returns trigger language plpgsql set search_path = '' as $$
declare k text; v jsonb;
begin
  if new.weights is null then return new; end if;
  if jsonb_typeof(new.weights) <> 'object' then
    raise exception 'Pesos inválidos';
  end if;
  for k, v in select * from jsonb_each(new.weights) loop
    if not exists (select 1 from public.criteria where key = k)
       or jsonb_typeof(v) <> 'number' or v::numeric < 0 or v::numeric > 3 then
      raise exception 'Peso inválido para %', k;
    end if;
  end loop;
  return new;
end $$;

create trigger rodas_weights before insert or update of weights on public.rodas
  for each row execute function public.validate_roda_weights();

-- O dono não muda por update direto (transferência só por RPC)
create or replace function public.protect_roda_owner()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.owner_id <> old.owner_id and current_setting('app.transfer_owner', true) is distinct from 'on' then
    raise exception 'Use a transferência de dono.';
  end if;
  return new;
end $$;

create trigger rodas_owner before update of owner_id on public.rodas
  for each row execute function public.protect_roda_owner();

-- =====================================================================
-- XP, Brasas, níveis e conquistas
-- =====================================================================
create or replace function public.award(
  p_user uuid, p_kind text, p_xp integer, p_brasas integer, p_ref uuid default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_today date := public.today_br();
  v_today_xp integer;
  v_cap constant integer := 400;
  v_xp integer := p_xp;
  v_brasas integer := p_brasas;
  v_prof public.profiles%rowtype;
  v_new_level integer;
  v_daily_xp integer := 0;
  v_bonus integer := 0;
begin
  select * into v_prof from public.profiles where id = p_user for update;
  if not found then return; end if;

  -- Teto diário anti-farm: passou do teto, a ação não rende XP nem Brasas
  select coalesce(sum(xp), 0) into v_today_xp
  from public.xp_events
  where user_id = p_user and (created_at at time zone 'America/Sao_Paulo')::date = v_today;
  v_xp := greatest(0, least(v_xp, v_cap - v_today_xp));
  if v_xp = 0 and p_xp > 0 then v_brasas := 0; end if;

  -- Primeira atividade do dia: bônus + sequência
  if v_prof.last_active_date is distinct from v_today then
    insert into public.xp_events (user_id, kind, xp, brasas) values (p_user, 'daily', 10, 3);
    v_prof.streak := case when v_prof.last_active_date = v_today - 1 then v_prof.streak + 1 else 1 end;
    v_daily_xp := 10;
    v_bonus := 3;
  end if;

  insert into public.xp_events (user_id, kind, xp, brasas, ref_id)
  values (p_user, p_kind, v_xp, v_brasas, p_ref);

  v_new_level := public.level_for_xp(v_prof.xp + v_xp + v_daily_xp);
  if v_new_level > v_prof.level then
    -- Subiu de nível: 25 Brasas por nível
    v_bonus := v_bonus + 25 * (v_new_level - v_prof.level);
    insert into public.xp_events (user_id, kind, xp, brasas)
    values (p_user, 'level_up', 0, 25 * (v_new_level - v_prof.level));
  end if;

  update public.profiles
  set xp = xp + v_xp + v_daily_xp,
      level = greatest(level, v_new_level),
      brasas = greatest(0, brasas + v_brasas + v_bonus),
      last_active_date = v_today,
      streak = v_prof.streak
  where id = p_user;

  perform public.check_badges(p_user);
end $$;

create or replace function public.grant_badge(p_user uuid, p_badge text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_reward integer;
begin
  insert into public.user_badges (user_id, badge_key) values (p_user, p_badge)
  on conflict do nothing;
  if found then
    select reward_brasas into v_reward from public.badges where key = p_badge;
    if coalesce(v_reward, 0) > 0 then
      insert into public.xp_events (user_id, kind, xp, brasas) values (p_user, 'badge:' || p_badge, 0, v_reward);
      update public.profiles set brasas = brasas + v_reward where id = p_user;
    end if;
  end if;
end $$;

create or replace function public.check_badges(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_prof public.profiles%rowtype;
begin
  select * into v_prof from public.profiles where id = p_user;

  if exists (select 1 from public.bolados where roller_id = p_user) then
    perform public.grant_badge(p_user, 'primeiro_cone');
  end if;
  if exists (select 1 from public.rodas where owner_id = p_user) then
    perform public.grant_badge(p_user, 'fundador');
  end if;
  if exists (
    select 1 from public.evaluations e join public.bolados b on b.id = e.bolado_id
    where b.roller_id = p_user and e.total = 10
  ) then
    perform public.grant_badge(p_user, 'nota_10');
  end if;
  if (select count(*) from public.evaluations where evaluator_id = p_user) >= 10 then
    perform public.grant_badge(p_user, 'avaliador_justo');
  end if;
  if (select count(*) from public.evaluations where evaluator_id = p_user) >= 50 then
    perform public.grant_badge(p_user, 'critico_gourmet');
  end if;
  if v_prof.streak >= 7 then
    perform public.grant_badge(p_user, 'sequencia_7');
  end if;
  if (select count(*) from public.bolados where roller_id = p_user and type = 'tabaco' and final_score >= 8.5) >= 5 then
    perform public.grant_badge(p_user, 'mestre_tabaco');
  end if;
  if (select count(*) from public.bolados where roller_id = p_user and type = 'beck' and final_score >= 8.5) >= 5 then
    perform public.grant_badge(p_user, 'mestre_beck');
  end if;
  if (select count(*) from public.bolado_media where uploader_id = p_user and kind = 'photo') >= 10 then
    perform public.grant_badge(p_user, 'fotografo');
  end if;
  if (select count(*) from public.bolado_media where uploader_id = p_user and kind in ('video', 'link')) >= 3 then
    perform public.grant_badge(p_user, 'cineasta');
  end if;
  if v_prof.level >= 10 then
    perform public.grant_badge(p_user, 'veterano');
  end if;
end $$;

-- XP ao registrar bolado e mídia
create or replace function public.on_bolado_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.award(new.roller_id, 'bolado_rolled', 20, 10, new.id);
  if new.created_by is not null and new.created_by <> new.roller_id then
    perform public.award(new.created_by, 'bolado_registered', 5, 2, new.id);
  end if;
  return new;
end $$;

create trigger bolados_created after insert on public.bolados
  for each row execute function public.on_bolado_created();

create or replace function public.on_media_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.award(new.uploader_id, 'media_' || new.kind::text, 5, 2, new.id);
  return new;
end $$;

create trigger media_created after insert on public.bolado_media
  for each row execute function public.on_media_created();

create trigger rodas_created after insert on public.rodas
  for each row execute function public.handle_new_roda();

-- Nota final do bolado = média das notas dos avaliadores
create or replace function public.recalc_bolado(p_bolado uuid)
returns void language sql security definer set search_path = '' as $$
  update public.bolados b
  set final_score = s.avg_total, evaluations_count = s.n
  from (
    select round(avg(total), 2) as avg_total, count(*)::int as n
    from public.evaluations where bolado_id = p_bolado
  ) s
  where b.id = p_bolado
$$;

create or replace function public.on_evaluation_deleted()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.recalc_bolado(old.bolado_id);
  return old;
end $$;

create trigger evaluations_deleted after delete on public.evaluations
  for each row execute function public.on_evaluation_deleted();

-- =====================================================================
-- RPCs chamadas pelo app
-- =====================================================================

-- Nome de usuário disponível? (usado no cadastro, antes do login)
create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = '' as $$
  select lower(p_username) ~ '^[a-z0-9_.]{3,20}$'
     and not exists (select 1 from public.profiles where username = lower(p_username))
$$;

-- Envia (ou edita em até 24 h) a avaliação de um bolado
create or replace function public.submit_evaluation(
  p_bolado uuid,
  p_scores jsonb,      -- [{ "key": "estetica", "score": 8.5, "checklist": ["..."] }, ...]
  p_feedback text default null,
  p_airflow public.airflow default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_bolado public.bolados%rowtype;
  v_weights jsonb;
  v_existing public.evaluations%rowtype;
  v_eval_id uuid;
  v_total numeric;
  v_sum numeric := 0;
  v_wsum numeric := 0;
  v_item jsonb;
  v_key text;
  v_score numeric;
  v_w numeric;
  v_required text[];
  v_given text[] := '{}';
  v_roller_score numeric;
begin
  if v_uid is null then raise exception 'Faça login para avaliar.'; end if;

  select * into v_bolado from public.bolados where id = p_bolado;
  if not found then raise exception 'Bolado não encontrado.'; end if;
  if not public.is_roda_member(v_bolado.roda_id) then
    raise exception 'Você não faz parte desta roda.';
  end if;
  if v_bolado.roller_id = v_uid then
    raise exception 'Você não pode avaliar o próprio bolado.';
  end if;
  if jsonb_typeof(p_scores) <> 'array' then raise exception 'Notas inválidas.'; end if;
  if p_feedback is not null and char_length(p_feedback) > 1000 then
    raise exception 'Feedback muito longo.';
  end if;

  select weights into v_weights from public.rodas where id = v_bolado.roda_id;

  for v_item in select * from jsonb_array_elements(p_scores) loop
    v_key := v_item ->> 'key';
    v_score := (v_item ->> 'score')::numeric;
    if v_key = any (v_given) then raise exception 'Critério repetido: %', v_key; end if;
    v_w := null;
    select coalesce((v_weights ->> c.key)::numeric, c.weight) into v_w
    from public.criteria c where c.key = v_key;
    if v_w is null then raise exception 'Critério desconhecido: %', v_key; end if;
    if v_score is null or v_score < 0 or v_score > 10 or v_score * 2 <> floor(v_score * 2) then
      raise exception 'Nota inválida em %', v_key;
    end if;
    v_given := v_given || v_key;
    v_sum := v_sum + v_score * v_w;
    v_wsum := v_wsum + v_w;
  end loop;

  select array_agg(key) into v_required from public.criteria where not optional;
  if not (v_required <@ v_given) then
    raise exception 'Preencha todos os critérios obrigatórios.';
  end if;
  if v_wsum = 0 then raise exception 'Pesos zerados.'; end if;
  v_total := round(v_sum / v_wsum, 2);

  select * into v_existing from public.evaluations
  where bolado_id = p_bolado and evaluator_id = v_uid;

  if found then
    if v_existing.created_at < now() - interval '24 hours' then
      raise exception 'A avaliação só pode ser editada nas primeiras 24 horas.';
    end if;
    update public.evaluations
    set total = v_total, feedback = nullif(trim(p_feedback), ''), airflow = p_airflow, updated_at = now()
    where id = v_existing.id;
    v_eval_id := v_existing.id;
    delete from public.evaluation_scores where evaluation_id = v_eval_id;
  else
    insert into public.evaluations (bolado_id, evaluator_id, total, feedback, airflow)
    values (p_bolado, v_uid, v_total, nullif(trim(p_feedback), ''), p_airflow)
    returning id into v_eval_id;
  end if;

  insert into public.evaluation_scores (evaluation_id, criterion_key, score, checklist)
  select v_eval_id, e ->> 'key', (e ->> 'score')::numeric,
         coalesce(case when jsonb_typeof(e -> 'checklist') = 'array' then e -> 'checklist' end, '[]'::jsonb)
  from jsonb_array_elements(p_scores) e;

  perform public.recalc_bolado(p_bolado);

  if v_existing.id is null then
    perform public.award(v_uid, 'evaluation_given', 15, 8, v_eval_id);
    perform public.award(v_bolado.roller_id, 'evaluation_received', 5, 2, v_eval_id);
    if v_total >= 9 then
      perform public.award(v_bolado.roller_id, 'high_score', 15, 5, v_eval_id);
    end if;
  else
    perform public.check_badges(v_bolado.roller_id);
  end if;

  select final_score into v_roller_score from public.bolados where id = p_bolado;
  return jsonb_build_object('evaluation_id', v_eval_id, 'total', v_total, 'final_score', v_roller_score);
end $$;

-- Entrar numa roda pelo código de convite
create or replace function public.join_roda(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_roda uuid;
begin
  if auth.uid() is null then raise exception 'Faça login.'; end if;
  select id into v_roda from public.rodas where invite_code = upper(trim(p_code));
  if v_roda is null then raise exception 'Código de convite inválido.'; end if;
  if (select count(*) from public.roda_members where roda_id = v_roda) >= 50 then
    raise exception 'Esta roda está cheia (50 membros).';
  end if;
  insert into public.roda_members (roda_id, user_id) values (v_roda, auth.uid())
  on conflict do nothing;
  return v_roda;
end $$;

create or replace function public.regenerate_invite(p_roda uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_code text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
begin
  if not public.is_roda_admin(p_roda) then raise exception 'Sem permissão.'; end if;
  update public.rodas set invite_code = v_code where id = p_roda;
  return v_code;
end $$;

create or replace function public.set_member_role(p_roda uuid, p_user uuid, p_role public.roda_role)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.rodas where id = p_roda and owner_id = auth.uid()) then
    raise exception 'Só o dono da roda muda funções.';
  end if;
  if p_role = 'owner' then
    perform set_config('app.transfer_owner', 'on', true);
    update public.roda_members set role = 'admin' where roda_id = p_roda and user_id = auth.uid();
    update public.roda_members set role = 'owner' where roda_id = p_roda and user_id = p_user;
    if not found then raise exception 'Membro não encontrado.'; end if;
    update public.rodas set owner_id = p_user where id = p_roda;
  else
    if p_user = auth.uid() then raise exception 'Transfira a roda antes de mudar sua função.'; end if;
    update public.roda_members set role = p_role where roda_id = p_roda and user_id = p_user;
  end if;
end $$;

create or replace function public.remove_member(p_roda uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_target public.roda_role;
begin
  select role into v_target from public.roda_members where roda_id = p_roda and user_id = p_user;
  if v_target is null then return; end if;
  if v_target = 'owner' then
    raise exception 'O dono não pode sair sem transferir a roda.';
  end if;
  if p_user <> auth.uid() and not public.is_roda_admin(p_roda) then
    raise exception 'Sem permissão.';
  end if;
  delete from public.roda_members where roda_id = p_roda and user_id = p_user;
end $$;

-- Ranking da roda com média bayesiana ("Nota Ouro")
create or replace function public.get_roda_ranking(p_roda uuid, p_type public.bolado_type default null)
returns table (
  user_id uuid, username text, display_name text, avatar_path text, level integer,
  active_frame text, active_title text,
  bolados integer, avg_score numeric, best_score numeric, nota_ouro numeric, last_rolled_at timestamptz
) language plpgsql stable security definer set search_path = '' as $$
declare v_mean numeric;
begin
  if not public.is_roda_member(p_roda) then raise exception 'Sem acesso a esta roda.'; end if;
  select coalesce(avg(final_score), 7.0) into v_mean
  from public.bolados where roda_id = p_roda and final_score is not null
    and (p_type is null or type = p_type);

  return query
  with stats as (
    select b.roller_id, count(*)::int as n, avg(b.final_score) as a, max(b.final_score) as best,
           max(b.rolled_at) as last_at
    from public.bolados b
    where b.roda_id = p_roda and b.final_score is not null and (p_type is null or b.type = p_type)
    group by b.roller_id
  )
  select p.id, p.username::text, p.display_name, p.avatar_path, p.level, p.active_frame, p.active_title,
         coalesce(s.n, 0), round(s.a, 2), s.best,
         round(case when s.n is null then null else (3 * v_mean + s.n * s.a) / (3 + s.n) end, 2),
         s.last_at
  from public.roda_members m
  join public.profiles p on p.id = m.user_id
  left join stats s on s.roller_id = m.user_id
  where m.roda_id = p_roda
  order by 11 desc nulls last, 8 desc, p.display_name;
end $$;

-- Ranking global: só perfis públicos, só números agregados
create or replace function public.get_global_ranking(p_type public.bolado_type default null, p_limit integer default 50)
returns table (
  user_id uuid, username text, display_name text, avatar_path text, level integer,
  active_frame text, active_title text,
  bolados integer, avg_score numeric, best_score numeric, nota_ouro numeric
) language plpgsql stable security definer set search_path = '' as $$
declare v_mean numeric;
begin
  if auth.uid() is null then raise exception 'Faça login.'; end if;
  select coalesce(avg(final_score), 7.0) into v_mean
  from public.bolados where final_score is not null and (p_type is null or type = p_type);

  return query
  select p.id, p.username::text, p.display_name, p.avatar_path, p.level, p.active_frame, p.active_title,
         count(*)::int, round(avg(b.final_score), 2), max(b.final_score),
         round((5 * v_mean + count(*) * avg(b.final_score)) / (5 + count(*)), 2)
  from public.bolados b
  join public.profiles p on p.id = b.roller_id
  where p.is_public and b.final_score is not null and (p_type is null or b.type = p_type)
  group by p.id
  order by 11 desc, 8 desc
  limit least(greatest(p_limit, 1), 100);
end $$;

-- Estatísticas do perfil (respeita visibilidade)
create or replace function public.get_profile_stats(p_user uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_view_profile(p_user) then raise exception 'Perfil privado.'; end if;
  return jsonb_build_object(
    'bolados', (select count(*) from public.bolados where roller_id = p_user),
    'avaliados', (select count(*) from public.bolados where roller_id = p_user and final_score is not null),
    'avg_tabaco', (select round(avg(final_score), 2) from public.bolados where roller_id = p_user and type = 'tabaco'),
    'avg_beck', (select round(avg(final_score), 2) from public.bolados where roller_id = p_user and type = 'beck'),
    'best', (select max(final_score) from public.bolados where roller_id = p_user),
    'evaluations_given', (select count(*) from public.evaluations where evaluator_id = p_user),
    'avg_given', (select round(avg(total), 2) from public.evaluations where evaluator_id = p_user),
    'criteria', (
      select coalesce(jsonb_object_agg(criterion_key, a), '{}'::jsonb) from (
        select s.criterion_key, round(avg(s.score), 2) as a
        from public.evaluation_scores s
        join public.evaluations e on e.id = s.evaluation_id
        join public.bolados b on b.id = e.bolado_id
        where b.roller_id = p_user
        group by s.criterion_key
      ) x
    )
  );
end $$;

-- Loja: comprar item
create or replace function public.purchase_item(p_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_item public.shop_items%rowtype;
  v_prof public.profiles%rowtype;
begin
  if v_uid is null then raise exception 'Faça login.'; end if;
  select * into v_item from public.shop_items where key = p_key;
  if not found then raise exception 'Item não encontrado.'; end if;
  select * into v_prof from public.profiles where id = v_uid for update;
  if exists (select 1 from public.user_items where user_id = v_uid and item_key = p_key) then
    raise exception 'Você já tem este item.';
  end if;
  if v_prof.level < v_item.min_level then
    raise exception 'Disponível a partir do nível %.', v_item.min_level;
  end if;
  if v_prof.brasas < v_item.price then
    raise exception 'Brasas insuficientes.';
  end if;
  update public.profiles set brasas = brasas - v_item.price where id = v_uid;
  insert into public.user_items (user_id, item_key) values (v_uid, p_key);
  insert into public.xp_events (user_id, kind, xp, brasas) values (v_uid, 'purchase:' || p_key, 0, -v_item.price);
  return jsonb_build_object('brasas', v_prof.brasas - v_item.price);
end $$;

-- Loja: equipar tema, moldura ou título (null desequipa moldura/título)
create or replace function public.equip_item(p_kind public.shop_kind, p_key text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_value text;
begin
  if v_uid is null then raise exception 'Faça login.'; end if;
  if p_key is not null then
    if not exists (
      select 1 from public.shop_items i
      where i.key = p_key and i.kind = p_kind
        and (i.price = 0 or exists (select 1 from public.user_items u where u.user_id = v_uid and u.item_key = i.key))
    ) then
      raise exception 'Você ainda não tem este item.';
    end if;
    select data ->> 'value' into v_value from public.shop_items where key = p_key;
  end if;

  if p_kind = 'theme' then
    update public.profiles set active_theme = coalesce(v_value, 'ouro') where id = v_uid;
  elsif p_kind = 'frame' then
    update public.profiles set active_frame = v_value where id = v_uid;
  else
    update public.profiles set active_title = v_value where id = v_uid;
  end if;
end $$;

-- LGPD: exportar todos os meus dados
create or replace function public.export_my_data()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Faça login.'; end if;
  return jsonb_build_object(
    'exported_at', now(),
    'account', (select jsonb_build_object('email', email, 'created_at', created_at, 'last_sign_in_at', last_sign_in_at)
                from auth.users where id = v_uid),
    'profile', (select to_jsonb(p) from public.profiles p where id = v_uid),
    'consents', (select coalesce(jsonb_agg(to_jsonb(c)), '[]') from public.consents c where user_id = v_uid),
    'rodas', (select coalesce(jsonb_agg(jsonb_build_object('roda', r.name, 'role', m.role, 'joined_at', m.joined_at)), '[]')
              from public.roda_members m join public.rodas r on r.id = m.roda_id where m.user_id = v_uid),
    'bolados', (select coalesce(jsonb_agg(to_jsonb(b)), '[]') from public.bolados b where roller_id = v_uid or created_by = v_uid),
    'evaluations_given', (
      select coalesce(jsonb_agg(to_jsonb(e) || jsonb_build_object('scores',
        (select jsonb_agg(to_jsonb(s)) from public.evaluation_scores s where s.evaluation_id = e.id))), '[]')
      from public.evaluations e where evaluator_id = v_uid),
    'evaluations_received', (
      select coalesce(jsonb_agg(jsonb_build_object('bolado_id', e.bolado_id, 'total', e.total, 'feedback', e.feedback, 'created_at', e.created_at)), '[]')
      from public.evaluations e join public.bolados b on b.id = e.bolado_id where b.roller_id = v_uid),
    'media', (select coalesce(jsonb_agg(to_jsonb(m)), '[]') from public.bolado_media m where uploader_id = v_uid),
    'xp_events', (select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at), '[]') from public.xp_events x where user_id = v_uid),
    'badges', (select coalesce(jsonb_agg(to_jsonb(ub)), '[]') from public.user_badges ub where user_id = v_uid),
    'items', (select coalesce(jsonb_agg(to_jsonb(ui)), '[]') from public.user_items ui where user_id = v_uid)
  );
end $$;

-- LGPD: excluir minha conta. Os arquivos do Storage são apagados pelo app antes.
-- Rodas que eu criei passam para o membro mais antigo; sem membros, são apagadas.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); r record; v_heir uuid;
begin
  if v_uid is null then raise exception 'Faça login.'; end if;
  perform set_config('app.transfer_owner', 'on', true);
  for r in select id from public.rodas where owner_id = v_uid loop
    select user_id into v_heir from public.roda_members
    where roda_id = r.id and user_id <> v_uid
    order by (role = 'admin') desc, joined_at asc limit 1;
    if v_heir is null then
      delete from public.rodas where id = r.id;
    else
      update public.roda_members set role = 'owner' where roda_id = r.id and user_id = v_heir;
      update public.rodas set owner_id = v_heir where id = r.id;
    end if;
  end loop;
  delete from auth.users where id = v_uid;
end $$;

-- LGPD: revogar um consentimento
create or replace function public.revoke_consent(p_kind text)
returns void language sql security definer set search_path = '' as $$
  update public.consents set revoked_at = now()
  where user_id = auth.uid() and kind = p_kind and revoked_at is null
$$;

-- =====================================================================
-- Privilégios: funções internas não podem ser chamadas pelo cliente
-- =====================================================================
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.today_br() to authenticated;
grant execute on function public.level_for_xp(integer) to anon, authenticated;
grant execute on function public.is_roda_member(uuid) to authenticated;
grant execute on function public.is_roda_admin(uuid) to authenticated;
grant execute on function public.shares_roda(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.submit_evaluation(uuid, jsonb, text, public.airflow) to authenticated;
grant execute on function public.join_roda(text) to authenticated;
grant execute on function public.regenerate_invite(uuid) to authenticated;
grant execute on function public.set_member_role(uuid, uuid, public.roda_role) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.get_roda_ranking(uuid, public.bolado_type) to authenticated;
grant execute on function public.get_global_ranking(public.bolado_type, integer) to authenticated;
grant execute on function public.get_profile_stats(uuid) to authenticated;
grant execute on function public.purchase_item(text) to authenticated;
grant execute on function public.equip_item(public.shop_kind, text) to authenticated;
grant execute on function public.export_my_data() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.revoke_consent(text) to authenticated;

alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.consents          enable row level security;
alter table public.rodas             enable row level security;
alter table public.roda_members      enable row level security;
alter table public.criteria          enable row level security;
alter table public.bolados           enable row level security;
alter table public.bolado_media      enable row level security;
alter table public.evaluations       enable row level security;
alter table public.evaluation_scores enable row level security;
alter table public.xp_events         enable row level security;
alter table public.badges            enable row level security;
alter table public.user_badges       enable row level security;
alter table public.shop_items        enable row level security;
alter table public.user_items        enable row level security;

-- Anônimo não lê nada das tabelas
revoke all on all tables in schema public from anon;

-- profiles: lê o próprio, os públicos e quem divide roda comigo.
-- Update só de campos editáveis (xp, brasas, nível e temas ficam de fora).
create policy profiles_select on public.profiles for select to authenticated
  using (public.can_view_profile(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke insert, update, delete on public.profiles from authenticated;
grant update (username, display_name, avatar_path, bio, birthdate, is_public) on public.profiles to authenticated;

-- consents: só os meus; inserir novos, revogar via RPC
create policy consents_select on public.consents for select to authenticated
  using (user_id = (select auth.uid()));
create policy consents_insert on public.consents for insert to authenticated
  with check (user_id = (select auth.uid()));
revoke update, delete on public.consents from authenticated;

-- rodas
create policy rodas_select on public.rodas for select to authenticated
  using (public.is_roda_member(id));
create policy rodas_insert on public.rodas for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy rodas_update on public.rodas for update to authenticated
  using (public.is_roda_admin(id)) with check (public.is_roda_admin(id));
create policy rodas_delete on public.rodas for delete to authenticated
  using (owner_id = (select auth.uid()));
revoke update on public.rodas from authenticated;
grant update (name, description, weights) on public.rodas to authenticated;

-- roda_members: vejo os membros das minhas rodas; entrada/saída por RPC
create policy members_select on public.roda_members for select to authenticated
  using (public.is_roda_member(roda_id));
revoke insert, update, delete on public.roda_members from authenticated;

-- criteria, badges, shop_items: catálogo público para logados
create policy criteria_select on public.criteria for select to authenticated using (true);
create policy badges_select on public.badges for select to authenticated using (true);
create policy shop_select on public.shop_items for select to authenticated using (true);
revoke insert, update, delete on public.criteria, public.badges, public.shop_items from authenticated;

-- bolados
create policy bolados_select on public.bolados for select to authenticated
  using (public.is_roda_member(roda_id));
create policy bolados_insert on public.bolados for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and public.is_roda_member(roda_id)
    and exists (select 1 from public.roda_members m where m.roda_id = bolados.roda_id and m.user_id = bolados.roller_id)
  );
create policy bolados_update on public.bolados for update to authenticated
  using (created_by = (select auth.uid()) or public.is_roda_admin(roda_id))
  with check (created_by = (select auth.uid()) or public.is_roda_admin(roda_id));
create policy bolados_delete on public.bolados for delete to authenticated
  using (created_by = (select auth.uid()) or roller_id = (select auth.uid()) or public.is_roda_admin(roda_id));
revoke update on public.bolados from authenticated;
grant update (paper, filter, notes, rolled_at, type) on public.bolados to authenticated;

-- bolado_media
create policy media_select on public.bolado_media for select to authenticated
  using (public.is_roda_member(roda_id));
create policy media_insert on public.bolado_media for insert to authenticated
  with check (
    uploader_id = (select auth.uid())
    and public.is_roda_member(roda_id)
    and exists (select 1 from public.bolados b where b.id = bolado_id and b.roda_id = bolado_media.roda_id)
    and (storage_path is null or storage_path like roda_id::text || '/' || bolado_id::text || '/%')
  );
create policy media_delete on public.bolado_media for delete to authenticated
  using (uploader_id = (select auth.uid()) or public.is_roda_admin(roda_id));
revoke update on public.bolado_media from authenticated;

-- evaluations: leitura na roda; escrita só pela RPC submit_evaluation; apagar a própria
create policy evaluations_select on public.evaluations for select to authenticated
  using (exists (select 1 from public.bolados b where b.id = bolado_id and public.is_roda_member(b.roda_id)));
create policy evaluations_delete on public.evaluations for delete to authenticated
  using (evaluator_id = (select auth.uid()));
revoke insert, update on public.evaluations from authenticated;

create policy scores_select on public.evaluation_scores for select to authenticated
  using (exists (
    select 1 from public.evaluations e join public.bolados b on b.id = e.bolado_id
    where e.id = evaluation_id and public.is_roda_member(b.roda_id)
  ));
revoke insert, update, delete on public.evaluation_scores from authenticated;

-- gamificação: leio o que é meu; conquistas de perfis visíveis
create policy xp_select on public.xp_events for select to authenticated
  using (user_id = (select auth.uid()));
revoke insert, update, delete on public.xp_events from authenticated;

create policy user_badges_select on public.user_badges for select to authenticated
  using (public.can_view_profile(user_id));
revoke insert, update, delete on public.user_badges from authenticated;

create policy user_items_select on public.user_items for select to authenticated
  using (user_id = (select auth.uid()));
revoke insert, update, delete on public.user_items from authenticated;

-- =====================================================================
-- Storage: buckets privados + políticas por pasta
--   avatars/{user_id}/arquivo
--   media/{roda_id}/{bolado_id}/arquivo
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('media', 'media', false, 52428800,
   array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do nothing;

create policy avatars_select on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and public.can_view_profile(((storage.foldername(name))[1])::uuid));
create policy avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy media_obj_select on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_roda_member(((storage.foldername(name))[1])::uuid));
create policy media_obj_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_roda_member(((storage.foldername(name))[1])::uuid));
create policy media_obj_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (owner_id = (select auth.uid())::text
         or public.is_roda_admin(((storage.foldername(name))[1])::uuid)));
