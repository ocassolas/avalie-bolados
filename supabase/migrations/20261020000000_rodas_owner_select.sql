-- O dono precisa enxergar a roda no INSERT ... RETURNING: a linha dele em
-- roda_members só é criada pelo trigger AFTER INSERT, depois da checagem de RLS.
drop policy if exists rodas_select on public.rodas;
create policy rodas_select on public.rodas for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_roda_member(id));
