import { Hono } from 'hono';
import { z } from 'zod';
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

export default admin;
export { toCsv };
