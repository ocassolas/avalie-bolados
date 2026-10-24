-- O que tem dentro do bolado. O tipo (tabaco, beck, cumbaia, ervas) passa a
-- ser derivado do conteúdo, no banco. Chaves espelhadas em src/lib/contents.ts.

alter table public.bolados
  add column if not exists contents text[] not null default '{}',
  add column if not exists mix_tobacco_pct smallint check (mix_tobacco_pct between 0 and 100),
  add column if not exists paper_size text check (char_length(paper_size) <= 30),
  add column if not exists weight_g numeric(4,2) check (weight_g > 0 and weight_g <= 20);

alter table public.bolados add constraint bolados_contents_valid check (
  cardinality(contents) <= 12
  and contents <@ array[
    'tabaco_desfiado', 'tabaco_rolo', 'tabaco_aromatizado', 'tabaco_natural', 'palheiro',
    'flor', 'prensado', 'flor_cbd', 'dry', 'kief', 'haxixe', 'ice', 'crumble', 'rosin', 'wax', 'shatter', 'oleo', 'moonrock',
    'ervas_blend', 'ervas_aromaticas',
    'mentol', 'essencia'
  ]::text[]
);

create or replace function public.derive_bolado_type(p_contents text[])
returns public.bolado_type language sql immutable set search_path = '' as $$
  select case
    when p_contents && array['tabaco_desfiado','tabaco_rolo','tabaco_aromatizado','tabaco_natural','palheiro']
     and p_contents && array['flor','prensado','flor_cbd','dry','kief','haxixe','ice','crumble','rosin','wax','shatter','oleo','moonrock']
      then 'cumbaia'::public.bolado_type
    when p_contents && array['tabaco_desfiado','tabaco_rolo','tabaco_aromatizado','tabaco_natural','palheiro']
      then 'tabaco'::public.bolado_type
    when p_contents && array['flor','prensado','flor_cbd','dry','kief','haxixe','ice','crumble','rosin','wax','shatter','oleo','moonrock']
      then 'beck'::public.bolado_type
    when p_contents && array['ervas_blend','ervas_aromaticas']
      then 'ervas'::public.bolado_type
  end
$$;

-- Com conteúdo informado, o tipo é sempre o derivado (o cliente não decide).
-- Proporção só faz sentido em cumbaia.
create or replace function public.set_bolado_type()
returns trigger language plpgsql set search_path = '' as $$
declare v_type public.bolado_type;
begin
  new.contents := array(select distinct unnest(new.contents) order by 1);
  if cardinality(new.contents) > 0 then
    v_type := public.derive_bolado_type(new.contents);
    if v_type is null then
      raise exception 'Escolha pelo menos uma base: tabaco, flor/extração ou ervas.';
    end if;
    new.type := v_type;
  end if;
  if new.type <> 'cumbaia' then new.mix_tobacco_pct := null; end if;
  return new;
end $$;

drop trigger if exists bolados_set_type on public.bolados;
create trigger bolados_set_type before insert or update of contents, type, mix_tobacco_pct on public.bolados
  for each row execute function public.set_bolado_type();

revoke update on public.bolados from authenticated;
grant update (paper, filter, notes, rolled_at, type, contents, mix_tobacco_pct, paper_size, weight_g) on public.bolados to authenticated;

-- Conquistas novas
insert into public.badges (key, name, description, icon, rarity, reward_brasas, sort) values
  ('mestre_cumbaia', 'Mestre da Cumbaia', '5 cumbaias com nota final 8,5 ou mais.', 'flame', 'epica', 150, 9),
  ('laboratorio', 'Laboratório', 'Usou 6 conteúdos diferentes nos seus bolados.', 'flask', 'rara', 60, 12)
on conflict (key) do nothing;

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
  if (select count(*) from public.bolados where roller_id = p_user and type = 'cumbaia' and final_score >= 8.5) >= 5 then
    perform public.grant_badge(p_user, 'mestre_cumbaia');
  end if;
  if (select count(distinct c) from public.bolados b, unnest(b.contents) c where b.roller_id = p_user) >= 6 then
    perform public.grant_badge(p_user, 'laboratorio');
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

-- Estatísticas do perfil: média por tipo e conteúdos favoritos
create or replace function public.get_profile_stats(p_user uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_view_profile(p_user) then raise exception 'Perfil privado.'; end if;
  return jsonb_build_object(
    'bolados', (select count(*) from public.bolados where roller_id = p_user),
    'avaliados', (select count(*) from public.bolados where roller_id = p_user and final_score is not null),
    'avg_tabaco', (select round(avg(final_score), 2) from public.bolados where roller_id = p_user and type = 'tabaco'),
    'avg_beck', (select round(avg(final_score), 2) from public.bolados where roller_id = p_user and type = 'beck'),
    'by_type', (
      select coalesce(jsonb_object_agg(type, a), '{}'::jsonb) from (
        select type, round(avg(final_score), 2) as a from public.bolados
        where roller_id = p_user and final_score is not null group by type
      ) t
    ),
    'top_contents', (
      select coalesce(jsonb_agg(c order by n desc, c), '[]'::jsonb) from (
        select c, count(*) as n from public.bolados b, unnest(b.contents) c
        where b.roller_id = p_user group by c order by n desc, c limit 5
      ) x
    ),
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

revoke execute on function public.derive_bolado_type(text[]) from public, anon;
grant execute on function public.derive_bolado_type(text[]) to authenticated; -- usada pelo trigger, que roda como quem insere
revoke execute on function public.set_bolado_type() from public, anon, authenticated;
revoke execute on function public.check_badges(uuid) from public, anon, authenticated;
grant execute on function public.get_profile_stats(uuid) to authenticated;
