-- Course Content Management System
-- Extends course_module_content to support video, PDF, and YouTube uploads
-- Adds course_materials table for library organization

-- Extend course_module_content with content type tracking
alter table public.course_module_content
  add column if not exists content_type text default 'video' check (content_type in ('video','pdf','youtube_link')),
  add column if not exists file_id uuid references public.files(id) on delete set null,
  add column if not exists created_at timestamptz default now();

-- Index for efficient lookups
create index if not exists course_module_content_type_idx on public.course_module_content(content_type);

-- Course materials library: templates, guides, ROI calculators, sample content
create table if not exists public.course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  material_type text not null check (material_type in ('template','guide','calculator','sample','syllabus','case_study')),
  title text not null,
  description text,
  file_id uuid references public.files(id) on delete set null,
  pricing_model text, -- e.g., 'fixed', 'tiered', 'pay_per_use'
  roi_info jsonb, -- { 'estimated_roi': '250%', 'payback_period_months': 3 }
  course_structure jsonb, -- Modules outline as JSON
  industry text, -- 'hr', 'payroll', 'recruitment', 'compliance'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger course_materials_updated_at before update on public.course_materials
  for each row execute function public.set_updated_at();
create index course_materials_type_idx on public.course_materials(material_type);
create index course_materials_industry_idx on public.course_materials(industry);

-- Video metadata for efficient playback and streaming
create table if not exists public.video_metadata (
  id uuid primary key default gen_random_uuid(),
  file_id uuid unique not null references public.files(id) on delete cascade,
  duration_seconds integer, -- video duration
  resolution text, -- '720p', '1080p', '4k'
  bitrate_kbps integer,
  transcoding_status text default 'pending' check (transcoding_status in ('pending','transcoding','ready','failed')),
  thumbnail_url text, -- R2 URL for thumbnail
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger video_metadata_updated_at before update on public.video_metadata
  for each row execute function public.set_updated_at();

-- Track course content uploads and versions
create table if not exists public.course_content_versions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  version_number integer not null,
  content_type text not null check (content_type in ('video','pdf','youtube_link')),
  file_id uuid references public.files(id) on delete set null,
  youtube_url text,
  notes text,
  published boolean default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (module_id, version_number)
);
create index content_versions_module_idx on public.course_content_versions(module_id, version_number desc);

-- YouTube link tracking for demo and reference content
create table if not exists public.youtube_links (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  module_id uuid references public.course_modules(id) on delete cascade,
  youtube_url text not null,
  video_title text,
  thumbnail_url text,
  duration_seconds integer,
  description text,
  category text check (category in ('hr','payroll','recruitment','compliance','general')),
  is_demo boolean default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index youtube_links_course_idx on public.youtube_links(course_id);
create index youtube_links_demo_idx on public.youtube_links(is_demo);

-- RLS policies for course content access
create policy "students_see_purchased_content" on public.course_module_content
  as permissive for select
  using (
    exists (
      select 1 from public.enrollments e
      where e.course_id = (select course_id from public.course_modules where id = module_id)
        and e.user_id = auth.uid()
        and e.status in ('active','completed')
    )
    or public.is_admin()
  );

create policy "admins_manage_content" on public.course_module_content
  as permissive for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "public_course_materials" on public.course_materials
  as permissive for select
  using (true); -- Browseable by all

create policy "admins_manage_materials" on public.course_materials
  as permissive for all
  using (public.is_admin())
  with check (public.is_admin());
