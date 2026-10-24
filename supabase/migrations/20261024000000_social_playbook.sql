-- =====================================================================
-- Social (amizades), nível de habilidade e Playbook (o jeito de bolar)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Amizades
-- ---------------------------------------------------------------------
create type public.friend_status as enum ('pending', 'accepted');

create table public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status       public.friend_status not null default 'pending',
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  check (requester_id <> addressee_id)
);
-- Um único vínculo por par, não importa quem pediu
create unique index friendships_pair_idx on public.friendships
  (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on public.friendships (addressee_id, status);
create index friendships_requester_idx on public.friendships (requester_id, status);

alter table public.friendships enable row level security;
create policy friendships_select on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));
revoke insert, update, delete on public.friendships from authenticated;
revoke all on public.friendships from anon;

create or replace function public.is_friend(p_other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester_id = (select auth.uid()) and addressee_id = p_other)
        or (addressee_id = (select auth.uid()) and requester_id = p_other))
  )
$$;

-- Amigos também enxergam o perfil (além de quem divide roda e perfis públicos)
create or replace function public.can_view_profile(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_user = (select auth.uid())
      or exists (select 1 from public.profiles where id = p_user and is_public)
      or public.shares_roda(p_user)
      or public.is_friend(p_user)
$$;

-- Nível de habilidade: Nota Ouro global (média bayesiana de todos os bolados
-- avaliados da pessoa, com 3 bolados "fantasma" na média geral do app).
create or replace function public.skill_of(p_user uuid)
returns table (bolados integer, nota numeric)
language sql stable security definer set search_path = '' as $$
  with g as (
    select coalesce(avg(final_score), 7.0) as mean from public.bolados where final_score is not null
  ), s as (
    select count(*)::int as n, avg(final_score) as a
    from public.bolados where roller_id = p_user and final_score is not null
  )
  select s.n, case when s.n = 0 then null else round((3 * g.mean + s.n * s.a) / (3 + s.n), 2) end
  from s, g
$$;

create or replace function public.get_skill(p_user uuid)
returns table (bolados integer, nota numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_view_profile(p_user) then raise exception 'Perfil privado.'; end if;
  return query select * from public.skill_of(p_user);
end $$;

-- Pedir amizade pelo @. Se a outra pessoa já tinha pedido, vira amizade na hora.
create or replace function public.send_friend_request(p_username text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_target uuid;
  v_row public.friendships%rowtype;
begin
  if v_uid is null then raise exception 'Faça login.'; end if;
  select id into v_target from public.profiles where username = lower(trim(p_username));
  if v_target is null then raise exception 'Ninguém com esse @.'; end if;
  if v_target = v_uid then raise exception 'Você não pode se adicionar.'; end if;

  select * into v_row from public.friendships
  where least(requester_id, addressee_id) = least(v_uid, v_target)
    and greatest(requester_id, addressee_id) = greatest(v_uid, v_target);

  if found then
    if v_row.status = 'accepted' then return 'already'; end if;
    if v_row.requester_id = v_uid then return 'pending'; end if;
    update public.friendships set status = 'accepted', accepted_at = now() where id = v_row.id;
    perform public.check_social_badges(v_uid);
    perform public.check_social_badges(v_target);
    return 'accepted';
  end if;

  if (select count(*) from public.friendships where requester_id = v_uid and status = 'pending') >= 50 then
    raise exception 'Você tem pedidos demais esperando resposta.';
  end if;
  insert into public.friendships (requester_id, addressee_id) values (v_uid, v_target);
  return 'sent';
end $$;

create or replace function public.respond_friend_request(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_row public.friendships%rowtype;
begin
  select * into v_row from public.friendships where id = p_id and addressee_id = auth.uid() and status = 'pending';
  if not found then raise exception 'Pedido não encontrado.'; end if;
  if p_accept then
    update public.friendships set status = 'accepted', accepted_at = now() where id = p_id;
    perform public.check_social_badges(v_row.requester_id);
    perform public.check_social_badges(v_row.addressee_id);
  else
    delete from public.friendships where id = p_id;
  end if;
end $$;

-- Desfaz amizade ou cancela pedido (qualquer um dos lados)
create or replace function public.remove_friend(p_other uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.friendships
  where least(requester_id, addressee_id) = least(auth.uid(), p_other)
    and greatest(requester_id, addressee_id) = greatest(auth.uid(), p_other)
$$;

-- Busca por @ (prefixo, mínimo 2 letras). Só devolve o básico de cada pessoa.
create or replace function public.search_users(p_query text)
returns table (id uuid, username text, display_name text, avatar_path text, level integer, active_frame text, relation text)
language plpgsql stable security definer set search_path = '' as $$
declare v_q text := lower(regexp_replace(coalesce(p_query, ''), '[^a-zA-Z0-9_.]', '', 'g'));
begin
  if auth.uid() is null then raise exception 'Faça login.'; end if;
  if char_length(v_q) < 2 then return; end if;
  return query
  select p.id, p.username::text, p.display_name, p.avatar_path, p.level, p.active_frame,
    case
      when f.status = 'accepted' then 'friend'
      when f.requester_id = auth.uid() then 'outgoing'
      when f.addressee_id = auth.uid() then 'incoming'
      else 'none'
    end
  from public.profiles p
  left join public.friendships f
    on least(f.requester_id, f.addressee_id) = least(auth.uid(), p.id)
   and greatest(f.requester_id, f.addressee_id) = greatest(auth.uid(), p.id)
  where p.id <> auth.uid() and p.birthdate is not null and p.username like v_q || '%'
  order by (p.username = v_q) desc, p.username
  limit 10;
end $$;

-- Amigos e pedidos, com nível de habilidade de cada um
create or replace function public.get_friends()
returns table (
  friendship_id uuid, status public.friend_status, direction text, since timestamptz,
  user_id uuid, username text, display_name text, avatar_path text, level integer,
  active_frame text, active_title text, bolados integer, nota numeric
) language sql stable security definer set search_path = '' as $$
  select f.id, f.status,
         case when f.requester_id = auth.uid() then 'outgoing' else 'incoming' end,
         coalesce(f.accepted_at, f.created_at),
         p.id, p.username::text, p.display_name, p.avatar_path, p.level, p.active_frame, p.active_title,
         s.bolados, s.nota
  from public.friendships f
  join public.profiles p on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  cross join lateral public.skill_of(p.id) s
  where auth.uid() in (f.requester_id, f.addressee_id)
  order by f.status, s.nota desc nulls last, p.display_name
$$;

-- Gente que eu conheço (amigos, rodas, perfis públicos) com o nível de cada um,
-- para achar quem bola no mesmo nível. A faixa é calculada no app.
create or replace function public.get_skill_peers(p_limit integer default 200)
returns table (user_id uuid, username text, display_name text, avatar_path text, level integer,
               active_frame text, is_friend boolean, bolados integer, nota numeric)
language sql stable security definer set search_path = '' as $$
  with known as (
    select p.id from public.profiles p
    where p.id <> auth.uid() and p.birthdate is not null
      and (p.is_public or public.shares_roda(p.id) or public.is_friend(p.id))
  )
  select p.id, p.username::text, p.display_name, p.avatar_path, p.level, p.active_frame,
         public.is_friend(p.id), s.bolados, s.nota
  from known k
  join public.profiles p on p.id = k.id
  cross join lateral public.skill_of(p.id) s
  where s.nota is not null
  order by s.nota desc
  limit least(greatest(p_limit, 1), 500)
$$;

-- ---------------------------------------------------------------------
-- Playbook: o tutorial de como cada um bola (opcional)
-- ---------------------------------------------------------------------
create table public.playbooks (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  style           text check (char_length(style) <= 40),
  intro           text check (char_length(intro) <= 500),
  tips            text check (char_length(tips) <= 1000),
  favorite_paper  text check (char_length(favorite_paper) <= 60),
  favorite_filter text check (char_length(favorite_filter) <= 60),
  favorite_size   text check (char_length(favorite_size) <= 30),
  time_minutes    smallint check (time_minutes between 1 and 120),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.playbook_steps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.playbooks (user_id) on delete cascade,
  position   smallint not null check (position between 1 and 20),
  title      text not null check (char_length(title) between 1 and 80),
  body       text check (char_length(body) <= 600),
  media_path text,
  created_at timestamptz not null default now(),
  check (media_path is null or media_path like user_id::text || '/%')
);
create index playbook_steps_user_idx on public.playbook_steps (user_id, position);

create trigger playbooks_touch before update on public.playbooks
  for each row execute function public.touch_updated_at();

alter table public.playbooks enable row level security;
alter table public.playbook_steps enable row level security;
revoke all on public.playbooks, public.playbook_steps from anon;

create policy playbooks_select on public.playbooks for select to authenticated
  using (public.can_view_profile(user_id));
create policy playbooks_insert on public.playbooks for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy playbooks_update on public.playbooks for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy playbooks_delete on public.playbooks for delete to authenticated
  using (user_id = (select auth.uid()));

create policy steps_select on public.playbook_steps for select to authenticated
  using (public.can_view_profile(user_id));
create policy steps_insert on public.playbook_steps for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy steps_update on public.playbook_steps for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy steps_delete on public.playbook_steps for delete to authenticated
  using (user_id = (select auth.uid()));

-- No máximo 20 passos; com 3 ou mais, conquista "Professor"
create or replace function public.on_playbook_step()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.playbook_steps where user_id = new.user_id) > 20 then
    raise exception 'O playbook aceita até 20 passos.';
  end if;
  if (select count(*) from public.playbook_steps where user_id = new.user_id) >= 3 then
    perform public.grant_badge(new.user_id, 'professor');
  end if;
  return new;
end $$;

create trigger playbook_steps_after after insert on public.playbook_steps
  for each row execute function public.on_playbook_step();

-- Bucket privado das fotos do playbook: playbooks/{user_id}/arquivo
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('playbooks', 'playbooks', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy playbooks_obj_select on storage.objects for select to authenticated
  using (bucket_id = 'playbooks' and public.can_view_profile(((storage.foldername(name))[1])::uuid));
create policy playbooks_obj_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'playbooks' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy playbooks_obj_delete on storage.objects for delete to authenticated
  using (bucket_id = 'playbooks' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------
-- Conquistas sociais
-- ---------------------------------------------------------------------
insert into public.badges (key, name, description, icon, rarity, reward_brasas, sort) values
  ('professor', 'Professor', 'Publicou um playbook com 3 passos ou mais.', 'book', 'rara', 60, 13),
  ('social', 'Resenha', 'Fez 5 amizades no app.', 'users', 'comum', 40, 14)
on conflict (key) do nothing;

create or replace function public.check_social_badges(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.friendships
      where status = 'accepted' and p_user in (requester_id, addressee_id)) >= 5 then
    perform public.grant_badge(p_user, 'social');
  end if;
end $$;

-- Sem cadastro completo, nada de amizades nem playbook (mesma trava do resto)
create trigger friendships_require_profile before insert on public.friendships
  for each row execute function public.require_complete_profile();
create trigger playbooks_require_profile before insert on public.playbooks
  for each row execute function public.require_complete_profile();

-- ---------------------------------------------------------------------
-- Privilégios
-- ---------------------------------------------------------------------
revoke execute on function public.skill_of(uuid) from public, anon, authenticated;
revoke execute on function public.check_social_badges(uuid) from public, anon, authenticated;
revoke execute on function public.on_playbook_step() from public, anon, authenticated;
revoke execute on function public.is_friend(uuid) from public, anon;
grant execute on function public.is_friend(uuid) to authenticated;
revoke execute on function public.get_skill(uuid) from public, anon;
grant execute on function public.get_skill(uuid) to authenticated;
revoke execute on function public.send_friend_request(text) from public, anon;
grant execute on function public.send_friend_request(text) to authenticated;
revoke execute on function public.respond_friend_request(uuid, boolean) from public, anon;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
revoke execute on function public.remove_friend(uuid) from public, anon;
grant execute on function public.remove_friend(uuid) to authenticated;
revoke execute on function public.search_users(text) from public, anon;
grant execute on function public.search_users(text) to authenticated;
revoke execute on function public.get_friends() from public, anon;
grant execute on function public.get_friends() to authenticated;
revoke execute on function public.get_skill_peers(integer) from public, anon;
grant execute on function public.get_skill_peers(integer) to authenticated;

-- LGPD: a exportação passa a incluir amizades e playbook
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
    'friendships', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'with', (select username from public.profiles where id = case when f.requester_id = v_uid then f.addressee_id else f.requester_id end),
        'status', f.status, 'requested_by_me', f.requester_id = v_uid, 'created_at', f.created_at, 'accepted_at', f.accepted_at)), '[]')
      from public.friendships f where v_uid in (f.requester_id, f.addressee_id)),
    'playbook', (select to_jsonb(pb) from public.playbooks pb where user_id = v_uid),
    'playbook_steps', (select coalesce(jsonb_agg(to_jsonb(s) order by s.position), '[]') from public.playbook_steps s where user_id = v_uid),
    'xp_events', (select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at), '[]') from public.xp_events x where user_id = v_uid),
    'badges', (select coalesce(jsonb_agg(to_jsonb(ub)), '[]') from public.user_badges ub where user_id = v_uid),
    'items', (select coalesce(jsonb_agg(to_jsonb(ui)), '[]') from public.user_items ui where user_id = v_uid)
  );
end $$;
