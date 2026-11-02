grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage on all sequences in schema public to authenticated;
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000b','b@x.com','{"full_name":"B","role":"client"}'),
 ('00000000-0000-0000-0000-00000000000c','c@x.com','{"full_name":"C","role":"client"}');
insert into public.course_modules(id,course_id,position,title) select '00000000-0000-0000-0000-0000000000a1', id, 1, 'HR m1' from public.courses where slug='hr';
insert into public.course_modules(id,course_id,position,title) select '00000000-0000-0000-0000-0000000000a2', id, 1, 'PF m1' from public.courses where slug='pf';
insert into public.course_module_content values ('00000000-0000-0000-0000-0000000000a1','https://secret'),('00000000-0000-0000-0000-0000000000a2','https://secret2');
insert into public.enrollments(id,user_id,course_id,payment_status) select '00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-00000000000b',id,'paid' from public.courses where slug='hr';
insert into public.tickets(id,client_id,category,subject,description) values ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-00000000000c','general','C ticket','x');
set role anon;
select 'anon module titles', count(*) from public.course_modules;
select 'anon content', count(*) from public.course_module_content;
reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-00000000000b';
select 'B content (paid hr only)', count(*) from public.course_module_content;
\set ON_ERROR_STOP 0
insert into public.module_progress values ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000a2');
insert into public.module_progress values ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000a1');
select 'own-course progress ok', count(*) from public.module_progress;
insert into public.files(owner_id,ticket_id,r2_key,file_name) values ('00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-0000000000f1','k','evil.pdf');
insert into public.files(owner_id,r2_key,file_name) values ('00000000-0000-0000-0000-00000000000b','k2','mine.pdf');
select 'B files', count(*) from public.files;
