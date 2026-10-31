import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { anonClient, userClient } from '../lib/supabase.js';

export const ACCESS_COOKIE = 'rk_at';
export const REFRESH_COOKIE = 'rk_rt';

export function readToken(c) {
  const header = c.req.header('Authorization') || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return getCookie(c, ACCESS_COOKIE) || null;
}

/** Verifies the Supabase access token and loads the profile. Sets c.var.user, c.var.profile, c.var.db. */
export const requireUser = createMiddleware(async (c, next) => {
  const token = readToken(c);
  if (!token) throw new HTTPException(401, { message: 'unauthorized' });

  const { data, error } = await anonClient(c.env).auth.getUser(token);
  if (error || !data?.user) throw new HTTPException(401, { message: 'unauthorized' });

  const db = userClient(c.env, token);
  const { data: profile } = await db.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
  if (profile?.status === 'suspended') throw new HTTPException(403, { message: 'account_suspended' });

  c.set('user', data.user);
  c.set('profile', profile);
  c.set('db', db);
  c.set('token', token);
  await next();
});

/** Use after requireUser. */
export const requireRole = (...roles) =>
  createMiddleware(async (c, next) => {
    const role = c.get('profile')?.role;
    if (!roles.includes(role)) throw new HTTPException(403, { message: 'forbidden' });
    await next();
  });
