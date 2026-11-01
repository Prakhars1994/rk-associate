-- Online course payments (guest checkout via Razorpay).
-- Written only by the Next.js server with the service-role key; RLS on, no public policies.
create table if not exists public.course_orders (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  course_slug text not null,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  contact text,
  email text,
  raw jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists course_orders_status_idx on public.course_orders (status, created_at desc);

alter table public.course_orders enable row level security;
revoke all on public.course_orders from anon, authenticated;
