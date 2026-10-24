-- Nomes certos dos tipos: tabaco + flor/extração é MESCLADO; CUMBAIA é o
-- blend de ervas naturais (sem tabaco, THC ou CBD). Renomeia os valores do
-- enum (as linhas existentes acompanham) e recria o que comparava pelo nome.

alter type public.bolado_type rename value 'cumbaia' to 'mesclado';
alter type public.bolado_type rename value 'ervas' to 'cumbaia';

create or replace function public.derive_bolado_type(p_contents text[])
returns public.bolado_type language sql immutable set search_path = '' as $$
  select case
    when p_contents && array['tabaco_desfiado','tabaco_rolo','tabaco_aromatizado','tabaco_natural','palheiro']
     and p_contents && array['flor','prensado','flor_cbd','dry','kief','haxixe','ice','crumble','rosin','wax','shatter','oleo','moonrock']
      then 'mesclado'::public.bolado_type
    when p_contents && array['tabaco_desfiado','tabaco_rolo','tabaco_aromatizado','tabaco_natural','palheiro']
      then 'tabaco'::public.bolado_type
    when p_contents && array['flor','prensado','flor_cbd','dry','kief','haxixe','ice','crumble','rosin','wax','shatter','oleo','moonrock']
      then 'beck'::public.bolado_type
    when p_contents && array['ervas_blend','ervas_aromaticas']
      then 'cumbaia'::public.bolado_type
  end
$$;

-- Proporção de tabaco só faz sentido no mesclado.
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
  if new.type <> 'mesclado' then new.mix_tobacco_pct := null; end if;
  return new;
end $$;

-- Conquistas: quem ganhou "Mestre da Cumbaia" ganhou com mesclados, então
-- passa para "Mestre do Mesclado". A cumbaia (ervas) fica com a conquista antiga.
insert into public.badges (key, name, description, icon, rarity, reward_brasas, sort) values
  ('mestre_mesclado', 'Mestre do Mesclado', '5 mesclados com nota final 8,5 ou mais.', 'flame', 'epica', 150, 9)
on conflict (key) do nothing;

update public.user_badges set badge_key = 'mestre_mesclado' where badge_key = 'mestre_cumbaia';

update public.badges
  set description = '5 cumbaias (ervas) com nota final 8,5 ou mais.', icon = 'sprout', sort = 10
  where key = 'mestre_cumbaia';

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
  if (select count(*) from public.bolados where roller_id = p_user and type = 'mesclado' and final_score >= 8.5) >= 5 then
    perform public.grant_badge(p_user, 'mestre_mesclado');
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

revoke execute on function public.derive_bolado_type(text[]) from public, anon;
grant execute on function public.derive_bolado_type(text[]) to authenticated;
revoke execute on function public.set_bolado_type() from public, anon, authenticated;
revoke execute on function public.check_badges(uuid) from public, anon, authenticated;
