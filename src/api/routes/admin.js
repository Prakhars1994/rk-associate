import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';
import { serviceClient } from '../lib/supabase.js';
import { validate, unwrap } from '../lib/validate.js';
import { requireUser, requireRole } from '../middleware/auth.js';

// Admin-only. Uses the service role after the role check, for cross-user reports.
const admin = new Hono();
admin.use('*', requireUser, requireRole('admin'));

const paging = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(200).default(50),
  format: z.enum(['json', 'csv']).default('json'),
});

function toCsv(rows) {
  if (!rows.length) return '';
  const flat = rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v && typeof v === 'object' ? JSON.stringify(v) : v])));
  const cols = Object.keys(flat[0]);
  // Quote everything and neutralise spreadsheet formulas (CSV injection).
  const cell = (v) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [cols.join(','), ...flat.map((r) => cols.map((k) => cell(r[k])).join(','))].join('\n');
}

const listing = (table, fields, orderBy) => async (c) => {
  const { page, per_page, format } = c.req.valid('query');
  const { data, error, count } = await serviceClient(c.env).from(table).select(fields, { count: 'exact' })
    .order(orderBy, { ascending: false }).range((page - 1) * per_page, page * per_page - 1);
  unwrap({ data, error });
  if (format === 'csv') {
    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="${table}-page${page}.csv"`);
    return c.body(toCsv(data));
  }
  return c.json({ [table]: data, total: count ?? data.length, page, per_page });
};

admin.get('/stats', async (c) => {
  const svc = serviceClient(c.env);
  const head = { count: 'exact', head: true };
  const [users, enrolments, openTickets, paid] = await Promise.all([
    svc.from('profiles').select('id', head),
    svc.from('enrollments').select('id', head).eq('payment_status', 'paid'),
    svc.from('tickets').select('id', head).in('status', ['open', 'in_progress', 'reopened']),
    svc.from('payments').select('amount_paise').eq('status', 'paid'),
  ]);
  const revenue = unwrap(paid).reduce((s, p) => s + p.amount_paise, 0);
  return c.json({ users: users.count ?? 0, paid_enrollments: enrolments.count ?? 0, open_tickets: openTickets.count ?? 0, revenue_paise: revenue });
});

admin.get('/users', validate('query', paging), listing('profiles', 'id, email, full_name, phone, role, status, created_at, last_login_at', 'created_at'));
admin.get('/enrollments', validate('query', paging), listing('enrollments', 'id, status, payment_status, progress_pct, enrolled_at, user:profiles(email, full_name), course:courses(slug, title)', 'enrolled_at'));
admin.get('/payments', validate('query', paging), listing('payments', 'id, amount_paise, currency, status, method, razorpay_order_id, razorpay_payment_id, created_at, user:profiles(email, full_name)', 'created_at'));

admin.patch('/users/:id', validate('param', z.object({ id: z.string().uuid() })), validate('json', z.object({
  role: z.enum(['student', 'client', 'trainer', 'admin']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
}).refine((v) => Object.keys(v).length > 0, 'nothing to update')), async (c) => {
  const { id } = c.req.valid('param');
  if (id === c.get('user').id) throw new HTTPException(400, { message: 'cannot_change_own_account' });
  const svc = serviceClient(c.env);
  const user = unwrap(await svc.from('profiles').update(c.req.valid('json')).eq('id', id).select('id, email, role, status').maybeSingle());
  if (!user) throw new HTTPException(404, { message: 'not_found' });
  unwrap(await svc.from('activity_logs').insert({ user_id: c.get('user').id, action: 'admin.update_user', resource_type: 'profile', resource_id: id, details: c.req.valid('json') }));
  return c.json({ user });
});

// ===== COURSE MANAGEMENT =====

// GET /api/admin/courses - list all courses
admin.get('/courses', validate('query', paging), async (c) => {
  const { page, per_page, format } = c.req.valid('query');
  const svc = serviceClient(c.env);
  const { data, error, count } = await svc.from('courses')
    .select('id, slug, title, description, price_paise, status, created_at')
    .order('created_at', { ascending: false })
    .range((page - 1) * per_page, page * per_page - 1);
  unwrap({ data, error });
  if (format === 'csv') {
    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="courses-page${page}.csv"`);
    return c.body(toCsv(data));
  }
  return c.json({ courses: data, total: count ?? data.length, page, per_page });
});

// POST /api/admin/courses - create course
const CreateCourseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9_-]+$/, 'lowercase alphanumeric, dash, underscore only'),
  title: z.string().min(1),
  description: z.string().optional(),
  price_paise: z.number().int().nonnegative(),
  duration_days: z.number().int().optional(),
  mode: z.string().optional(),
});

admin.post('/courses', zValidator('json', CreateCourseSchema), async (c) => {
  const body = c.req.valid('json');
  const svc = serviceClient(c.env);

  const { data, error } = await svc.from('courses')
    .insert([{ ...body, status: 'draft' }])
    .select()
    .single();

  if (error) throw new HTTPException(400, { message: error.message });
  unwrap(await svc.from('activity_logs').insert({ user_id: c.get('user').id, action: 'admin.create_course', resource_type: 'course', resource_id: data.id, details: body }));
  return c.json({ course: data }, 201);
});

// GET /api/admin/courses/:courseId - get course with modules and content
admin.get('/courses/:courseId', validate('param', z.object({ courseId: z.string().uuid() })), async (c) => {
  const { courseId } = c.req.valid('param');
  const svc = serviceClient(c.env);

  const { data: course, error: courseError } = await svc.from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (courseError) throw new HTTPException(404, { message: 'course not found' });

  const { data: modules } = await svc.from('course_modules')
    .select('id, position, title, course_module_content(id, content_type, content_url, created_at)')
    .eq('course_id', courseId)
    .order('position');

  const { data: materials } = await svc.from('course_materials')
    .select('*')
    .eq('course_id', courseId);

  return c.json({ course, modules: modules ?? [], materials: materials ?? [] });
});

// POST /api/admin/courses/:courseId/modules - add module
const AddModuleSchema = z.object({
  position: z.number().int().positive(),
  title: z.string().min(1),
});

admin.post('/courses/:courseId/modules', validate('param', z.object({ courseId: z.string().uuid() })), zValidator('json', AddModuleSchema), async (c) => {
  const { courseId } = c.req.valid('param');
  const body = c.req.valid('json');
  const svc = serviceClient(c.env);

  const { data, error } = await svc.from('course_modules')
    .insert([{ course_id: courseId, ...body }])
    .select()
    .single();

  if (error) throw new HTTPException(400, { message: error.message });
  return c.json({ module: data }, 201);
});

// POST /api/admin/modules/:moduleId/upload - upload video or PDF
admin.post('/modules/:moduleId/upload', validate('param', z.object({ moduleId: z.string().uuid() })), async (c) => {
  const { moduleId } = c.req.valid('param');
  const user = c.get('user');
  const svc = serviceClient(c.env);

  const formData = await c.req.formData();
  const file = formData.get('file');
  const contentType = formData.get('content_type');

  if (!file || !contentType) throw new HTTPException(400, { message: 'missing file or content_type' });
  if (!['video', 'pdf'].includes(contentType)) throw new HTTPException(400, { message: 'content_type must be video or pdf' });

  const mimeType = file.type;
  const allowedMimes = {
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    pdf: ['application/pdf'],
  };

  if (!allowedMimes[contentType].includes(mimeType)) {
    throw new HTTPException(400, { message: `invalid file type for ${contentType}` });
  }

  // Get module course_id
  const { data: module, error: moduleError } = await svc.from('course_modules')
    .select('course_id')
    .eq('id', moduleId)
    .single();

  if (moduleError) throw new HTTPException(404, { message: 'module not found' });

  // Upload to R2
  const r2Key = `courses/${module.course_id}/${moduleId}/${Date.now()}_${file.name}`;
  const buffer = await file.arrayBuffer();

  try {
    await c.env.FILES.put(r2Key, buffer, { httpMetadata: { contentType: mimeType } });
  } catch (err) {
    throw new HTTPException(500, { message: `R2 upload failed: ${err.message}` });
  }

  // Store file metadata
  const { data: fileRecord, error: fileError } = await svc.from('files')
    .insert([{ owner_id: user.id, r2_key: r2Key, file_name: file.name, content_type: mimeType, size_bytes: file.size }])
    .select()
    .single();

  if (fileError) throw new HTTPException(400, { message: fileError.message });

  // Add to course_module_content
  const contentUrl = `${c.env.R2_PUBLIC_URL}/${r2Key}`;
  const { data: content, error: contentError } = await svc.from('course_module_content')
    .insert([{ module_id: moduleId, content_type: contentType, content_url: contentUrl, file_id: fileRecord.id }])
    .select()
    .single();

  if (contentError) {
    await c.env.FILES.delete(r2Key);
    throw new HTTPException(400, { message: contentError.message });
  }

  if (contentType === 'video') {
    await svc.from('video_metadata').insert([{ file_id: fileRecord.id, transcoding_status: 'ready' }]);
  }

  unwrap(await svc.from('activity_logs').insert({ user_id: user.id, action: 'admin.upload_content', resource_type: 'module', resource_id: moduleId, details: { file_name: file.name, size_bytes: file.size } }));
  return c.json({ content, file: fileRecord, url: contentUrl }, 201);
});

// POST /api/admin/modules/:moduleId/youtube - add YouTube link
const AddYouTubeSchema = z.object({
  youtube_url: z.string().url(),
  video_title: z.string().optional(),
  description: z.string().optional(),
});

admin.post('/modules/:moduleId/youtube', validate('param', z.object({ moduleId: z.string().uuid() })), zValidator('json', AddYouTubeSchema), async (c) => {
  const { moduleId } = c.req.valid('param');
  const user = c.get('user');
  const body = c.req.valid('json');
  const svc = serviceClient(c.env);

  const { data: module } = await svc.from('course_modules').select('course_id').eq('id', moduleId).single();
  if (!module) throw new HTTPException(404, { message: 'module not found' });

  const { data: content, error: contentError } = await svc.from('course_module_content')
    .insert([{ module_id: moduleId, content_type: 'youtube_link', content_url: body.youtube_url }])
    .select()
    .single();

  if (contentError) throw new HTTPException(400, { message: contentError.message });

  await svc.from('youtube_links').insert([{
    course_id: module.course_id,
    module_id: moduleId,
    youtube_url: body.youtube_url,
    video_title: body.video_title,
    description: body.description,
    created_by: user.id,
  }]);

  return c.json({ content }, 201);
});

// POST /api/admin/courses/:courseId/publish - publish course
admin.post('/courses/:courseId/publish', validate('param', z.object({ courseId: z.string().uuid() })), async (c) => {
  const { courseId } = c.req.valid('param');
  const svc = serviceClient(c.env);

  const { data, error } = await svc.from('courses')
    .update({ status: 'active' })
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw new HTTPException(400, { message: error.message });
  unwrap(await svc.from('activity_logs').insert({ user_id: c.get('user').id, action: 'admin.publish_course', resource_type: 'course', resource_id: courseId }));
  return c.json({ course: data });
});

export default admin;
export { toCsv };
