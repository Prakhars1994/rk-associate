-- Row level security: users see their own rows; admins/trainers see everything.
-- Writes that involve money (payments, enrolment payment_status, certificates) go through
-- the Worker with the service role, so clients get no direct write policy for them.

alter table public.profiles        enable row level security;
alter table public.courses         enable row level security;
alter table public.course_modules  enable row level security;
alter table public.course_module_content enable row level security;
alter table public.enrollments     enable row level security;
alter table public.module_progress enable row level security;
alter table public.free_resources  enable row level security;
alter table public.payments        enable row level security;
alter table public.tickets         enable row level security;
alter table public.ticket_comments enable row level security;
alter table public.files           enable row level security;
alter table public.certificates    enable row level security;
alter table public.activity_logs   enable row level security;
alter table public.settings        enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- Users may edit name/phone only; role/status/email are protected by column grants.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- public catalogue
create policy courses_read on public.courses for select to anon, authenticated
  using (status = 'active' or (select public.is_admin()));
-- Module outline (titles) is public only for active courses.
create policy modules_read on public.course_modules for select to anon, authenticated
  using ((select public.is_admin()) or exists (
    select 1 from public.courses co where co.id = course_id and co.status = 'active'));
-- Lesson content only for a paid enrolment in that module's course, or staff.
create policy module_content_read on public.course_module_content for select to authenticated
  using ((select public.is_admin()) or exists (
    select 1 from public.course_modules m
    join public.enrollments e on e.course_id = m.course_id
    where m.id = module_id and e.user_id = (select auth.uid()) and e.payment_status = 'paid'));
create policy resources_read on public.free_resources for select to anon, authenticated using (true);

-- enrolments (created by the Worker after a payment order; read-only for users)
create policy enrollments_select on public.enrollments for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy progress_select on public.module_progress for select to authenticated
  using (exists (select 1 from public.enrollments e where e.id = enrollment_id
                 and (e.user_id = (select auth.uid()) or (select public.is_admin()))));
create policy progress_insert on public.module_progress for insert to authenticated
  with check (exists (select 1 from public.enrollments e
                      join public.course_modules m on m.course_id = e.course_id
                      where e.id = enrollment_id and m.id = module_id
                        and e.user_id = (select auth.uid()) and e.payment_status = 'paid'));

-- payments: read own
create policy payments_select on public.payments for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- tickets
create policy tickets_select on public.tickets for select to authenticated
  using (client_id = (select auth.uid()) or (select public.is_admin()));
create policy tickets_insert on public.tickets for insert to authenticated
  with check (client_id = (select auth.uid()) and assigned_to is null and status = 'open');
create policy tickets_admin_update on public.tickets for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ticket comments: clients never see internal notes
create policy comments_select on public.ticket_comments for select to authenticated
  using ((select public.is_admin()) or (not is_internal and exists (
    select 1 from public.tickets t where t.id = ticket_id and t.client_id = (select auth.uid()))));
create policy comments_insert on public.ticket_comments for insert to authenticated
  with check (author_id = (select auth.uid()) and (
    (select public.is_admin()) or (not is_internal and exists (
      select 1 from public.tickets t where t.id = ticket_id and t.client_id = (select auth.uid())))));

-- files
create policy files_select on public.files for select to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()) or exists (
    select 1 from public.tickets t where t.id = ticket_id and t.client_id = (select auth.uid())));
create policy files_insert on public.files for insert to authenticated
  with check (owner_id = (select auth.uid()) and (
    ticket_id is null or (select public.is_admin()) or exists (
      select 1 from public.tickets t where t.id = ticket_id and t.client_id = (select auth.uid()))));

-- certificates: owner and admins; public verification goes through the Worker
create policy certificates_select on public.certificates for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- activity logs & settings: admins only
create policy activity_admin on public.activity_logs for select to authenticated
  using ((select public.is_admin()));
create policy settings_admin on public.settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
