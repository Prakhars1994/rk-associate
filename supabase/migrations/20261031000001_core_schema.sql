-- RK Associates Phase 2 core schema (Supabase Postgres).
-- Replaces phase2-schema.sql, which used MySQL-only syntax and its own password table.
-- Identity lives in auth.users (Supabase Auth); public.profiles holds app data.

create extension if not exists pgcrypto;

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text,
  role text not null default 'student' check (role in ('student','client','trainer','admin')),
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);
create index profiles_role_idx on public.profiles(role);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile whenever someone signs up. Role from signup metadata is limited to
-- student/client so nobody can self-register as admin.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r text := coalesce(new.raw_user_meta_data->>'role', 'student');
begin
  if r not in ('student','client') then r := 'student'; end if;
  insert into public.profiles (id, email, full_name, phone, role)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', ''),
          new.raw_user_meta_data->>'phone', r);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','trainer'));
$$;

-- ---------- courses & enrolments ----------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  price_paise integer not null check (price_paise >= 0),
  duration_days integer,
  mode text,
  status text not null default 'active' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position integer not null,
  title text not null,
  unique (course_id, position)
);

-- Lesson content (video/doc links) is kept apart from the public module outline so it
-- can be restricted to paid learners.
create table public.course_module_content (
  module_id uuid primary key references public.course_modules(id) on delete cascade,
  content_url text not null
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id),
  status text not null default 'pending' check (status in ('pending','active','completed','dropped')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  progress_pct numeric(5,2) not null default 0 check (progress_pct between 0 and 100),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, course_id)
);
create index enrollments_course_idx on public.enrollments(course_id);

create table public.module_progress (
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  module_id uuid not null references public.course_modules(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (enrollment_id, module_id)
);

create table public.free_resources (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  kind text,
  file_key text,
  position integer not null default 0
);

-- ---------- payments ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id),
  user_id uuid not null references public.profiles(id),
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  status text not null default 'created' check (status in ('created','paid','failed','refunded')),
  method text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_user_status_idx on public.payments(user_id, status);
create index payments_enrollment_idx on public.payments(enrollment_id);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------- tickets ----------
create sequence public.ticket_number_seq start 1001;

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique not null default ('RK-' || nextval('public.ticket_number_seq')),
  client_id uuid not null references public.profiles(id),
  category text not null check (category in ('hr_policy','payroll','compliance','training','general')),
  subject text not null check (char_length(subject) between 3 and 200),
  description text not null,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed','reopened')),
  assigned_to uuid references public.profiles(id),
  satisfaction_rating smallint check (satisfaction_rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index tickets_client_status_idx on public.tickets(client_id, status);
create index tickets_assigned_idx on public.tickets(assigned_to);
create trigger tickets_updated_at before update on public.tickets
  for each row execute function public.set_updated_at();

create table public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);
create index ticket_comments_ticket_idx on public.ticket_comments(ticket_id);
create index ticket_comments_author_idx on public.ticket_comments(author_id);

-- ---------- files (stored in R2; this is metadata) ----------
create table public.files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  ticket_id uuid references public.tickets(id) on delete set null,
  r2_key text unique not null,
  file_name text not null,
  content_type text,
  size_bytes bigint check (size_bytes >= 0),
  created_at timestamptz not null default now()
);
create index files_owner_idx on public.files(owner_id, created_at);
create index files_ticket_idx on public.files(ticket_id);

-- ---------- certificates ----------
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid unique not null references public.enrollments(id),
  user_id uuid not null references public.profiles(id),
  course_id uuid not null references public.courses(id),
  verification_code text unique not null default encode(extensions.gen_random_bytes(8), 'hex'),
  r2_key text,
  issued_at timestamptz not null default now()
);
create index certificates_user_idx on public.certificates(user_id);
create index certificates_course_idx on public.certificates(course_id);

-- ---------- audit ----------
create table public.activity_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id uuid,
  details jsonb,
  ip inet,
  created_at timestamptz not null default now()
);
create index activity_logs_user_idx on public.activity_logs(user_id, created_at);

create table public.settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
