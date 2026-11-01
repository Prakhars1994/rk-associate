-- is_admin() is a SECURITY DEFINER helper used by RLS policies. In the public
-- schema it was also callable over the API (/rest/v1/rpc/is_admin). Move it to a
-- private schema that the API does not expose; policies keep working.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','trainer'));
$$;

revoke execute on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

do $$
declare p record; q text; c text; stmt text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public' and (qual like '%is_admin()%' or with_check like '%is_admin()%')
  loop
    q := replace(p.qual, 'is_admin()', 'private.is_admin()');
    c := replace(p.with_check, 'is_admin()', 'private.is_admin()');
    stmt := format('alter policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    if q is not null then stmt := stmt || ' using (' || q || ')'; end if;
    if c is not null then stmt := stmt || ' with check (' || c || ')'; end if;
    execute stmt;
  end loop;
end $$;

-- Fails (rolling back everything) if any policy still depends on the public one.
drop function public.is_admin();
