import { Hono } from 'hono';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { anonClient, serviceClient } from '../lib/supabase.js';
import { validate, unwrap } from '../lib/validate.js';
import { requireUser } from '../middleware/auth.js';

const COURSE_FIELDS = 'id, slug, title, description, price_paise, duration_days, mode';

/** Public catalogue: /api/courses, /api/free-resources */
export const catalogue = new Hono();

catalogue.get('/courses', async (c) => {
  const rows = unwrap(await anonClient(c.env).from('courses').select(COURSE_FIELDS).eq('status', 'active').order('price_paise'));
  c.header('Cache-Control', 'public, max-age=60');
  return c.json({ courses: rows });
});

catalogue.get('/courses/:slug', validate('param', z.object({ slug: z.string().regex(/^[a-z0-9-]{1,60}$/) })), async (c) => {
  const { slug } = c.req.valid('param');
  const course = unwrap(
    await anonClient(c.env)
      .from('courses')
      .select(`${COURSE_FIELDS}, course_modules(id, position, title)`)
      .eq('slug', slug)
      .eq('status', 'active')
      .order('position', { referencedTable: 'course_modules' })
      .maybeSingle()
  );
  if (!course) throw new HTTPException(404, { message: 'not_found' });
  return c.json({ course });
});

catalogue.get('/free-resources', async (c) => {
  const rows = unwrap(await anonClient(c.env).from('free_resources').select('slug, title, description, kind').order('position'));
  c.header('Cache-Control', 'public, max-age=300');
  return c.json({ resources: rows });
});

/** Signed-in learner: /api/me/... */
export const learner = new Hono();
learner.use('*', requireUser);

learner.get('/enrollments', async (c) => {
  const rows = unwrap(
    await c.get('db')
      .from('enrollments')
      .select(`id, status, payment_status, progress_pct, enrolled_at, completed_at, course:courses(${COURSE_FIELDS})`)
      .eq('user_id', c.get('user').id)
      .order('enrolled_at', { ascending: false })
  );
  return c.json({ enrollments: rows });
});

learner.post(
  '/enrollments/:id/progress',
  validate('param', z.object({ id: z.string().uuid() })),
  validate('json', z.object({ module_id: z.string().uuid() })),
  async (c) => {
    const { id } = c.req.valid('param');
    const { module_id } = c.req.valid('json');
    const db = c.get('db');

    // RLS only allows this insert for the user's own *paid* enrolment.
    const { error } = await db.from('module_progress').upsert({ enrollment_id: id, module_id }, { onConflict: 'enrollment_id,module_id', ignoreDuplicates: true });
    if (error) throw new HTTPException(403, { message: 'not_enrolled' });

    // Recompute progress with the service role (users can't write enrolments directly).
    const svc = serviceClient(c.env);
    const enrollment = unwrap(await svc.from('enrollments').select('id, course_id, status').eq('id', id).single());
    const [{ count: total }, { count: done }] = await Promise.all([
      svc.from('course_modules').select('id', { count: 'exact', head: true }).eq('course_id', enrollment.course_id),
      svc.from('module_progress').select('module_id', { count: 'exact', head: true }).eq('enrollment_id', id),
    ]);
    const pct = total ? Math.min(100, Math.round((done / total) * 10000) / 100) : 0;
    const patch = { progress_pct: pct };
    if (pct >= 100 && enrollment.status !== 'completed') Object.assign(patch, { status: 'completed', completed_at: new Date().toISOString() });
    unwrap(await svc.from('enrollments').update(patch).eq('id', id));

    return c.json({ enrollment_id: id, progress_pct: pct, completed: pct >= 100 });
  }
);
