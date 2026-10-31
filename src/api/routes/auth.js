import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { anonClient } from '../lib/supabase.js';
import { requireUser, ACCESS_COOKIE, REFRESH_COOKIE } from '../middleware/auth.js';

const auth = new Hono();

const email = z.string().trim().toLowerCase().email().max(255);
const password = z.string().min(8).max(72);

const registerSchema = z.object({
  email,
  password,
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,20}$/).optional(),
  role: z.enum(['student', 'client']).default('student'),
});
const loginSchema = z.object({ email, password: z.string().min(1).max(72) });

const validate = (schema) =>
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'invalid_input', issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) }, 400);
    }
  });

function setSessionCookies(c, session) {
  const base = { httpOnly: true, secure: true, sameSite: 'Lax', path: '/' };
  setCookie(c, ACCESS_COOKIE, session.access_token, { ...base, maxAge: session.expires_in ?? 3600 });
  setCookie(c, REFRESH_COOKIE, session.refresh_token, { ...base, path: '/api/auth', maxAge: 60 * 60 * 24 * 30 });
}

function sessionBody(session, user) {
  return {
    user: { id: user.id, email: user.email },
    access_token: session.access_token,
    expires_at: session.expires_at,
  };
}

auth.post('/register', validate(registerSchema), async (c) => {
  const { email, password, full_name, phone, role } = c.req.valid('json');
  const origin = new URL(c.req.url).origin;
  const { data, error } = await anonClient(c.env).auth.signUp({
    email,
    password,
    options: { data: { full_name, phone, role }, emailRedirectTo: `${origin}/login?confirmed=1` },
  });
  if (error) {
    const status = error.status === 422 || error.status === 400 ? 400 : 502;
    return c.json({ error: error.code || 'signup_failed', message: error.message }, status);
  }
  if (data.session) {
    setSessionCookies(c, data.session);
    return c.json({ ...sessionBody(data.session, data.user), needs_confirmation: false }, 201);
  }
  return c.json({ user: { id: data.user?.id, email }, needs_confirmation: true }, 201);
});

auth.post('/login', validate(loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const { data, error } = await anonClient(c.env).auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    // Same message for wrong email and wrong password.
    return c.json({ error: 'invalid_credentials' }, 401);
  }
  setSessionCookies(c, data.session);
  return c.json(sessionBody(data.session, data.user));
});

auth.post('/refresh', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const refresh_token = body.refresh_token || getCookie(c, REFRESH_COOKIE);
  if (!refresh_token) throw new HTTPException(401, { message: 'unauthorized' });
  const { data, error } = await anonClient(c.env).auth.refreshSession({ refresh_token });
  if (error || !data.session) throw new HTTPException(401, { message: 'unauthorized' });
  setSessionCookies(c, data.session);
  return c.json(sessionBody(data.session, data.user));
});

auth.post('/logout', async (c) => {
  deleteCookie(c, ACCESS_COOKIE, { path: '/' });
  deleteCookie(c, REFRESH_COOKIE, { path: '/api/auth' });
  return c.json({ ok: true });
});

auth.post('/forgot-password', validate(z.object({ email })), async (c) => {
  const { email } = c.req.valid('json');
  const origin = new URL(c.req.url).origin;
  await anonClient(c.env).auth.resetPasswordForEmail(email, { redirectTo: `${origin}/login?reset=1` });
  // Always 200 so the endpoint can't be used to discover accounts.
  return c.json({ ok: true });
});

auth.get('/me', requireUser, (c) => {
  const user = c.get('user');
  return c.json({ user: { id: user.id, email: user.email }, profile: c.get('profile') });
});

export default auth;
