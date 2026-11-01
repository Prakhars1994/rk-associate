-- The website adds enquiries with the public (publishable/anon) key.
-- Insert only: anon can never read, update or delete rows.
revoke all on public.enquiries from anon, authenticated;
grant insert on public.enquiries to anon;
create policy "Website can add new enquiries" on public.enquiries
  for insert to anon
  with check (status = 'new');
