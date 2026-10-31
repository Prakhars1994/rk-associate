-- Catalogue as shown on the live site (prices in paise). Client content replaces this later.
insert into public.courses (slug, title, description, price_paise, duration_days, mode) values
 ('hr', 'Professional HR Course', 'Complete practical HR program covering recruitment, onboarding, PF/ESIC, payroll, labour law, POSH, policies and L&D.', 499900, 45, 'Online & Offline'),
 ('pf', 'PF & ESIC Practical Training', 'Hands-on PF and ESIC workflows from registration through monthly compliance and employee support.', 699900, 30, 'Practical Focus'),
 ('recruitment', 'Recruitment & Onboarding', 'End-to-end recruitment process, candidate sourcing, interview techniques, and structured onboarding.', 599900, 28, 'Industry Standard'),
 ('payroll', 'Payroll & Compliance', 'Practical payroll processing with GST, TDS, compliance and employee support systems.', 599900, 28, 'Compliance Ready')
on conflict (slug) do nothing;

insert into public.free_resources (slug, title, description, kind, position) values
 ('demo-courses', 'Demo Courses', 'Free course previews', 'video', 1),
 ('qa-sheets', 'Q&A Sheets', 'Common HR questions answered', 'pdf', 2),
 ('resume-templates', 'Resume Templates', 'Professional HR resume examples', 'doc', 3),
 ('hr-checklists', 'HR Checklists', 'Ready-to-use compliance checklists', 'pdf', 4),
 ('job-descriptions', 'Job Descriptions', 'Sample HR & HR-related JDs', 'doc', 5),
 ('video-samples', 'Video Samples', 'Sample training video clips', 'video', 6),
 ('hr-handbook', 'HR Handbook', 'Complete HR operations guide', 'pdf', 7),
 ('case-studies', 'Case Studies', 'Real-world HR solutions', 'pdf', 8)
on conflict (slug) do nothing;
