import { Hono } from 'hono';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { serviceClient } from '../lib/supabase.js';
import { validate, unwrap } from '../lib/validate.js';
import { requireUser } from '../middleware/auth.js';
import { renderCertificate } from '../lib/certificate.js';

const codeParam = validate('param', z.object({ code: z.string().regex(/^[a-f0-9]{16}$/) }));

/** Public: /api/certificates/verify/:code */
export const certificatesPublic = new Hono();
certificatesPublic.get('/verify/:code', codeParam, async (c) => {
  const { code } = c.req.valid('param');
  const cert = unwrap(await serviceClient(c.env).from('certificates')
    .select('verification_code, issued_at, user:profiles(full_name), course:courses(title)').eq('verification_code', code).maybeSingle());
  if (!cert) return c.json({ valid: false }, 404);
  return c.json({ valid: true, name: cert.user?.full_name, course: cert.course?.title, issued_at: cert.issued_at });
});

/** Signed-in: /api/me/certificates... */
export const certificatesMine = new Hono();
certificatesMine.use('*', requireUser);

certificatesMine.post('/enrollments/:id/certificate', validate('param', z.object({ id: z.string().uuid() })), async (c) => {
  const { id } = c.req.valid('param');
  const user = c.get('user');
  const svc = serviceClient(c.env);
  const enr = unwrap(await svc.from('enrollments').select('id, user_id, course_id, status, course:courses(title)').eq('id', id).maybeSingle());
  if (!enr || enr.user_id !== user.id) throw new HTTPException(404, { message: 'not_found' });
  if (enr.status !== 'completed') throw new HTTPException(409, { message: 'course_not_completed' });

  let cert = unwrap(await svc.from('certificates').select('id, verification_code, issued_at, r2_key').eq('enrollment_id', id).maybeSingle());
  if (!cert) {
    cert = unwrap(await svc.from('certificates').insert({ enrollment_id: id, user_id: user.id, course_id: enr.course_id }).select('id, verification_code, issued_at, r2_key').single());
  }
  if (!cert.r2_key) {
    const origin = new URL(c.req.url).origin;
    const bytes = await renderCertificate({
      name: c.get('profile')?.full_name || user.email,
      course: enr.course?.title || 'Course',
      issuedAt: cert.issued_at,
      code: cert.verification_code,
      verifyUrl: `${origin}/api/certificates/verify/${cert.verification_code}`,
    });
    const key = `certificates/${cert.verification_code}.pdf`;
    await c.env.FILES.put(key, bytes, { httpMetadata: { contentType: 'application/pdf' } });
    unwrap(await svc.from('certificates').update({ r2_key: key }).eq('id', cert.id));
    cert.r2_key = key;
  }
  return c.json({ certificate: { code: cert.verification_code, issued_at: cert.issued_at, download: `/api/me/certificates/${cert.verification_code}.pdf` } }, 201);
});

certificatesMine.get('/certificates/:file{[a-f0-9]{16}\\.pdf}', async (c) => {
  const code = c.req.param('file').slice(0, 16);
  const cert = unwrap(await c.get('db').from('certificates').select('r2_key').eq('verification_code', code).maybeSingle()); // RLS: own only
  if (!cert?.r2_key) throw new HTTPException(404, { message: 'not_found' });
  const obj = await c.env.FILES.get(cert.r2_key);
  if (!obj) throw new HTTPException(404, { message: 'not_found' });
  return new Response(obj.body, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="RK-certificate-${code}.pdf"`, 'Cache-Control': 'private, no-store' } });
});
