import { Hono } from 'hono';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { validate, unwrap } from '../lib/validate.js';
import { requireUser } from '../middleware/auth.js';

// Files live in R2 (binding FILES); Postgres holds metadata and RLS decides who may read.
const files = new Hono();
files.use('*', requireUser);

export const MAX_BYTES = 10 * 1024 * 1024;
export const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/png', 'image/jpeg', 'image/webp',
  'text/csv', 'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const safeName = (name) => (name || 'file').normalize('NFKD').replace(/[^\w.\- ]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120) || 'file';

files.post('/', async (c) => {
  const form = await c.req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') throw new HTTPException(400, { message: 'file_required' });
  if (file.size > MAX_BYTES) throw new HTTPException(413, { message: 'file_too_large' });
  if (!ALLOWED_TYPES.has(file.type)) throw new HTTPException(415, { message: 'file_type_not_allowed' });

  const ticketId = form.get('ticket_id') || null;
  const db = c.get('db');
  if (ticketId) {
    if (!z.string().uuid().safeParse(ticketId).success) throw new HTTPException(400, { message: 'invalid_ticket_id' });
    const t = unwrap(await db.from('tickets').select('id').eq('id', ticketId).maybeSingle());
    if (!t) throw new HTTPException(404, { message: 'ticket_not_found' });
  }

  const userId = c.get('user').id;
  const name = safeName(file.name);
  const key = `u/${userId}/${crypto.randomUUID()}/${name}`;
  await c.env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { owner: userId } });

  const { data, error } = await db.from('files')
    .insert({ owner_id: userId, ticket_id: ticketId, r2_key: key, file_name: name, content_type: file.type, size_bytes: file.size })
    .select('id, file_name, content_type, size_bytes, ticket_id, created_at').single();
  if (error) {
    await c.env.FILES.delete(key);
    throw new Error(error.message);
  }
  return c.json({ file: data }, 201);
});

files.get('/', validate('query', z.object({ ticket_id: z.string().uuid().optional() })), async (c) => {
  const { ticket_id } = c.req.valid('query');
  let q = c.get('db').from('files').select('id, file_name, content_type, size_bytes, ticket_id, created_at, owner:profiles(full_name)').order('created_at', { ascending: false }).limit(200);
  q = ticket_id ? q.eq('ticket_id', ticket_id) : q.eq('owner_id', c.get('user').id);
  return c.json({ files: unwrap(await q) });
});

files.get('/:id/download', validate('param', z.object({ id: z.string().uuid() })), async (c) => {
  const { id } = c.req.valid('param');
  const meta = unwrap(await c.get('db').from('files').select('r2_key, file_name, content_type').eq('id', id).maybeSingle());
  if (!meta) throw new HTTPException(404, { message: 'not_found' });
  const obj = await c.env.FILES.get(meta.r2_key);
  if (!obj) throw new HTTPException(404, { message: 'not_found' });
  return new Response(obj.body, {
    headers: {
      'Content-Type': meta.content_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${meta.file_name.replace(/"/g, '')}"`,
      'Content-Length': String(obj.size),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});

export default files;
