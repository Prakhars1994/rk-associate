-- Trigger function must not be callable over the REST API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- is_admin() stays executable: RLS policies for anon/authenticated call it. It only reveals the caller's own role.
create index if not exists module_progress_module_idx on public.module_progress(module_id);
create index if not exists settings_updated_by_idx on public.settings(updated_by);
