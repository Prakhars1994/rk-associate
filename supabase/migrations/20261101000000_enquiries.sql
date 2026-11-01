-- Website enquiries from the contact page (business + training forms).
-- Written only by the Next.js server with the service-role key; RLS stays on
-- with no policies so the anon/public key can neither read nor write rows.
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('business', 'training')),
  name text not null check (char_length(name) between 1 and 120),
  mobile text not null check (char_length(mobile) between 6 and 20),
  email text check (email is null or char_length(email) <= 200),
  company text check (company is null or char_length(company) <= 200),
  service text check (service is null or char_length(service) <= 120),
  course text check (course is null or char_length(course) <= 120),
  experience text check (experience is null or char_length(experience) <= 40),
  employee_count text check (employee_count is null or char_length(employee_count) <= 20),
  preferred_batch text check (preferred_batch is null or char_length(preferred_batch) <= 120),
  message text check (message is null or char_length(message) <= 4000),
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'closed')),
  source_page text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status);

alter table public.enquiries enable row level security;
