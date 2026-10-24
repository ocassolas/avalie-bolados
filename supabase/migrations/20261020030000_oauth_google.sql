-- Login com Google (OAuth). O Google não manda data de nascimento nem os
-- aceites da LGPD: a conta nasce "incompleta" (birthdate nulo) e o app pede
-- esses dados em /completar-cadastro. Até completar, nenhuma escrita no app.

alter table public.profiles alter column birthdate drop not null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_birth date := nullif(meta ->> 'birthdate', '')::date;
  v_version text := coalesce(meta ->> 'consent_version', '2026-10-19');
  v_name text;
  v_base text;
  v_username text;
begin
  -- Cadastro por e-mail traz a data; quem vem pelo Google completa depois.
  if v_birth is not null and v_birth > (public.today_br() - interval '18 years')::date then
    raise exception 'O Avalie Bolados é só para maiores de 18 anos.';
  end if;

  v_name := left(coalesce(
    nullif(trim(meta ->> 'display_name'), ''),
    nullif(trim(meta ->> 'full_name'), ''),
    nullif(trim(meta ->> 'name'), ''),
    split_part(coalesce(new.email, 'bolador'), '@', 1)
  ), 40);

  if nullif(meta ->> 'username', '') is not null then
    -- Cadastro por e-mail: o @ escolhido (já checado como livre no app)
    v_username := lower(meta ->> 'username');
  else
    -- OAuth: gera um @ a partir do e-mail, com sufixo se já existir
    v_base := regexp_replace(lower(split_part(coalesce(new.email, ''), '@', 1)), '[^a-z0-9_.]', '', 'g');
    if char_length(v_base) < 3 then v_base := v_base || 'bolador'; end if;
    v_base := left(v_base, 15);
    v_username := v_base;
    while exists (select 1 from public.profiles where username = v_username) loop
      v_username := v_base || (floor(random() * 9000) + 1000)::int::text;
    end loop;
  end if;

  -- Bônus de boas-vindas: 50 Brasas para estrear a loja
  insert into public.profiles (id, username, display_name, birthdate, brasas)
  values (new.id, v_username, v_name, v_birth, 50);
  insert into public.xp_events (user_id, kind, xp, brasas) values (new.id, 'welcome', 0, 50);

  insert into public.consents (user_id, kind, version)
  select new.id, k, v_version
  from unnest(array['terms', 'privacy', 'sensitive_data']) as k
  where coalesce((meta ->> ('consent_' || k))::boolean, false);

  insert into public.user_items (user_id, item_key) values (new.id, 'theme_ouro')
  on conflict do nothing;

  return new;
end $$;

-- Data de nascimento: maior de idade e nunca volta a ficar vazia
create or replace function public.check_profile_age()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.birthdate is not null and new.birthdate is null then
    raise exception 'A data de nascimento não pode ficar vazia.';
  end if;
  if new.birthdate > (public.today_br() - interval '18 years')::date then
    raise exception 'O Avalie Bolados é só para maiores de 18 anos.';
  end if;
  return new;
end $$;

-- Completar cadastro (contas do Google): idade, @ e consentimentos da LGPD
create or replace function public.complete_profile(p_birthdate date, p_username text, p_display_name text, p_version text default '2026-10-19')
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_user text := lower(trim(p_username));
begin
  if v_uid is null then raise exception 'Faça login.'; end if;
  if p_birthdate is null or p_birthdate > (public.today_br() - interval '18 years')::date then
    raise exception 'O Avalie Bolados é só para maiores de 18 anos.';
  end if;
  if p_birthdate < date '1900-01-01' then raise exception 'Data de nascimento inválida.'; end if;
  if v_user !~ '^[a-z0-9_.]{3,20}$' then
    raise exception 'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.';
  end if;
  if exists (select 1 from public.profiles where username = v_user and id <> v_uid) then
    raise exception 'Este nome de usuário já está em uso.';
  end if;
  if char_length(trim(coalesce(p_display_name, ''))) not between 1 and 40 then
    raise exception 'Informe um nome de até 40 caracteres.';
  end if;

  update public.profiles
  set birthdate = p_birthdate, username = v_user, display_name = trim(p_display_name)
  where id = v_uid;

  insert into public.consents (user_id, kind, version)
  select v_uid, k, coalesce(p_version, '2026-10-19')
  from unnest(array['terms', 'privacy', 'sensitive_data']) as k
  where not exists (
    select 1 from public.consents c where c.user_id = v_uid and c.kind = k and c.revoked_at is null
  );
end $$;

revoke execute on function public.complete_profile(date, text, text, text) from public, anon;
grant execute on function public.complete_profile(date, text, text, text) to authenticated;

-- Trava: sem cadastro completo (idade confirmada) não cria nada no app.
-- auth.uid() nulo = service role/manutenção, que passa.
create or replace function public.require_complete_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null and not exists (
    select 1 from public.profiles where id = (select auth.uid()) and birthdate is not null
  ) then
    raise exception 'Complete seu cadastro (data de nascimento e termos) antes de continuar.';
  end if;
  return new;
end $$;

revoke execute on function public.require_complete_profile() from public, anon, authenticated;

drop trigger if exists rodas_require_profile on public.rodas;
create trigger rodas_require_profile before insert on public.rodas
  for each row execute function public.require_complete_profile();
drop trigger if exists members_require_profile on public.roda_members;
create trigger members_require_profile before insert on public.roda_members
  for each row execute function public.require_complete_profile();
drop trigger if exists bolados_require_profile on public.bolados;
create trigger bolados_require_profile before insert on public.bolados
  for each row execute function public.require_complete_profile();
drop trigger if exists media_require_profile on public.bolado_media;
create trigger media_require_profile before insert on public.bolado_media
  for each row execute function public.require_complete_profile();
drop trigger if exists evaluations_require_profile on public.evaluations;
create trigger evaluations_require_profile before insert or update on public.evaluations
  for each row execute function public.require_complete_profile();
