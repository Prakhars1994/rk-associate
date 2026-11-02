-- Seed demo courses with sample YouTube videos
-- These courses showcase different industries: HR, Payroll, Recruitment

-- Clear existing demo data (if migrating)
delete from public.courses where slug in ('intro-hr', 'payroll-basics', 'recruitment-strategies');

-- HR & Organization Management Course
insert into public.courses (slug, title, description, price_paise, duration_days, mode, status)
values (
  'intro-hr',
  'Introduction to HR & Employee Relations',
  'Master the fundamentals of human resources, from recruitment to retention. Learn best practices in employee management, compliance, and organizational development.',
  499900, -- ₹4,999
  30,
  'self-paced',
  'active'
);

-- Payroll & Finance Course
insert into public.courses (slug, title, description, price_paise, duration_days, mode, status)
values (
  'payroll-basics',
  'Payroll, PF & ESIC Practical Training',
  'Complete guide to payroll management, provident fund (PF), and Employee State Insurance (ESIC) compliance. Learn calculations, deductions, and regulatory requirements.',
  699900, -- ₹6,999
  45,
  'self-paced',
  'active'
);

-- Recruitment & Talent Acquisition Course
insert into public.courses (slug, title, description, price_paise, duration_days, mode, status)
values (
  'recruitment-strategies',
  'Recruitment Strategies & Talent Acquisition',
  'Learn modern recruitment techniques, candidate sourcing, interview strategies, and building effective talent pipelines for your organization.',
  549900, -- ₹5,499
  35,
  'self-paced',
  'active'
);

-- Add modules to HR course
with hr_course as (select id from public.courses where slug = 'intro-hr')
insert into public.course_modules (course_id, position, title)
select hr_course.id, 1, 'Understanding HR: Roles and Responsibilities' from hr_course
union all
select hr_course.id, 2, 'Recruitment and Onboarding' from hr_course
union all
select hr_course.id, 3, 'Performance Management & Development' from hr_course
union all
select hr_course.id, 4, 'Compensation, Benefits & Compliance' from hr_course;

-- Add modules to Payroll course
with payroll_course as (select id from public.courses where slug = 'payroll-basics')
insert into public.course_modules (course_id, position, title)
select payroll_course.id, 1, 'Payroll Fundamentals' from payroll_course
union all
select payroll_course.id, 2, 'Salary Structure & Calculations' from payroll_course
union all
select payroll_course.id, 3, 'Provident Fund (PF) Essentials' from payroll_course
union all
select payroll_course.id, 4, 'ESIC & Health Insurance' from payroll_course
union all
select payroll_course.id, 5, 'Compliance & Documentation' from payroll_course;

-- Add modules to Recruitment course
with rec_course as (select id from public.courses where slug = 'recruitment-strategies')
insert into public.course_modules (course_id, position, title)
select rec_course.id, 1, 'Recruitment Planning & Strategy' from rec_course
union all
select rec_course.id, 2, 'Sourcing Candidates Effectively' from rec_course
union all
select rec_course.id, 3, 'Interview Techniques & Assessment' from rec_course
union all
select rec_course.id, 4, 'Building Talent Pipelines' from rec_course;

-- Add YouTube content to HR course
with hr_course as (select id from public.courses where slug = 'intro-hr'),
     module1 as (select id from public.course_modules where course_id = (select id from hr_course) and position = 1)
insert into public.course_module_content (module_id, content_type, content_url)
select module1.id, 'youtube_link', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' from module1;

-- Add YouTube link to tracking
with hr_course as (select id from public.courses where slug = 'intro-hr'),
     module1 as (select id from public.course_modules where course_id = (select id from hr_course) and position = 1),
     admin_user as (select id from public.profiles where role = 'admin' limit 1)
insert into public.youtube_links (course_id, module_id, youtube_url, video_title, description, category, is_demo, created_by)
select hr_course.id, module1.id, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'HR Basics Overview', 'Introduction to HR fundamentals', 'hr', true, admin_user.id
from hr_course, module1, admin_user;

-- Add YouTube content to Payroll course
with payroll_course as (select id from public.courses where slug = 'payroll-basics'),
     module1 as (select id from public.course_modules where course_id = (select id from payroll_course) and position = 1)
insert into public.course_module_content (module_id, content_type, content_url)
select module1.id, 'youtube_link', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' from module1;

-- Add YouTube content to Recruitment course
with rec_course as (select id from public.courses where slug = 'recruitment-strategies'),
     module1 as (select id from public.course_modules where course_id = (select id from rec_course) and position = 1)
insert into public.course_module_content (module_id, content_type, content_url)
select module1.id, 'youtube_link', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' from module1;

-- Add course materials (ROI, pricing, structure info)
with hr_course as (select id from public.courses where slug = 'intro-hr')
insert into public.course_materials (course_id, material_type, title, description, pricing_model, roi_info, industry)
select hr_course.id, 'syllabus', 'Complete HR Syllabus', 'Comprehensive course outline covering all HR topics', 'fixed', '{"estimated_roi": "300%", "payback_period_months": 2, "avg_salary_increase": "₹2-5 lakhs"}'::jsonb, 'hr'
from hr_course
union all
select hr_course.id, 'case_study', 'HR Transformation Case Study', 'Real-world example of HR modernization', 'fixed', '{"improvements": "40% reduction in turnover", "efficiency_gain": "35%"}'::jsonb, 'hr'
from hr_course;

with payroll_course as (select id from public.courses where slug = 'payroll-basics')
insert into public.course_materials (course_id, material_type, title, description, pricing_model, roi_info, industry)
select payroll_course.id, 'calculator', 'Salary Calculator Tool', 'Interactive tool for salary calculations with PF & ESIC', 'fixed', '{"time_savings": "10 hours per month per payroll cycle", "error_reduction": "99%"}'::jsonb, 'payroll'
from payroll_course
union all
select payroll_course.id, 'guide', 'Compliance Checklist 2026', 'Updated compliance requirements and documentation', 'fixed', '{"compliance_coverage": "95%", "audit_ready": true}'::jsonb, 'payroll'
from payroll_course;

with rec_course as (select id from public.courses where slug = 'recruitment-strategies')
insert into public.course_materials (course_id, material_type, title, description, pricing_model, roi_info, industry)
select rec_course.id, 'template', 'Job Description Templates', 'Ready-to-use templates for various roles', 'fixed', '{"time_saved_per_posting": "4 hours", "quality_improvement": "60%"}'::jsonb, 'recruitment'
from rec_course
union all
select rec_course.id, 'guide', 'Interview Questions Guide', 'Comprehensive bank of interview questions by role', 'fixed', '{"coverage": "50+ roles", "assessment_validity": "high"}'::jsonb, 'recruitment'
from rec_course;
