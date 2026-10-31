import { Hono } from 'hono';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { validate, unwrap } from '../lib/validate.js';
import { requireUser, requireRole } from '../middleware/auth.js';

// All queries run as the signed-in user, so RLS decides what they can see/do:
// clients see their own tickets and non-internal comments; admins/trainers see all.
const tickets = new Hono();
tickets.use('*', requireUser);

const CATEGORIES = ['hr_policy', 'payroll', 'compliance', 'training', 'general'];
const STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'reopened'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const idParam = validate('param', z.object({ id: z.string().uuid() }));
const FIELDS = 'id, ticket_number, category, subject, description, priority, status, assigned_to, created_at, updated_at, resolved_at, client:profiles!tickets_client_id_fkey(id, full_name, email)';

tickets.post('/', validate('json', z.object({
  category: z.enum(CATEGORIES),
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(5).max(10000),
  priority: z.enum(PRIORITIES).default('medium'),
})), async (c) => {
  const input = c.req.valid('json');
  const ticket = unwrap(await c.get('db').from('tickets').insert({ ...input, client_id: c.get('user').id }).select('id, ticket_number, status').single());
  return c.json({ ticket }, 201);
});

tickets.get('/', validate('query', z.object({
  status: z.enum(STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
})), async (c) => {
  const { status, page, per_page } = c.req.valid('query');
  let q = c.get('db').from('tickets').select(FIELDS, { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * per_page, page * per_page - 1);
  if (status) q = q.eq('status', status);
  const { data, error, count } = await q;
  unwrap({ data, error });
  return c.json({ tickets: data, total: count ?? data.length, page, per_page });
});

tickets.get('/:id', idParam, async (c) => {
  const { id } = c.req.valid('param');
  const ticket = unwrap(await c.get('db').from('tickets')
    .select(`${FIELDS}, comments:ticket_comments(id, body, is_internal, created_at, author:profiles(id, full_name, role))`)
    .eq('id', id).order('created_at', { referencedTable: 'ticket_comments' }).maybeSingle());
  if (!ticket) throw new HTTPException(404, { message: 'not_found' });
  return c.json({ ticket });
});

tickets.post('/:id/comments', idParam, validate('json', z.object({
  body: z.string().trim().min(1).max(10000),
  is_internal: z.boolean().default(false),
})), async (c) => {
  const { id } = c.req.valid('param');
  const { body, is_internal } = c.req.valid('json');
  const isStaff = ['admin', 'trainer'].includes(c.get('profile')?.role);
  if (is_internal && !isStaff) throw new HTTPException(403, { message: 'forbidden' });
  const { data, error } = await c.get('db').from('ticket_comments').insert({ ticket_id: id, author_id: c.get('user').id, body, is_internal }).select('id, created_at').single();
  if (error) throw new HTTPException(404, { message: 'not_found' }); // RLS: not your ticket
  return c.json({ comment: data }, 201);
});

tickets.patch('/:id', requireRole('admin', 'trainer'), idParam, validate('json', z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
}).refine((v) => Object.keys(v).length > 0, 'nothing to update')), async (c) => {
  const { id } = c.req.valid('param');
  const patch = { ...c.req.valid('json') };
  if (patch.status === 'resolved') patch.resolved_at = new Date().toISOString();
  const ticket = unwrap(await c.get('db').from('tickets').update(patch).eq('id', id).select('id, ticket_number, status, priority, assigned_to').maybeSingle());
  if (!ticket) throw new HTTPException(404, { message: 'not_found' });
  return c.json({ ticket });
});

export default tickets;
