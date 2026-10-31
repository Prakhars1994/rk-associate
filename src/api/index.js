import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';
import auth from './routes/auth.js';

const api = new Hono();

api.use('*', secureHeaders());
api.use('*', (c, next) => {
  const allowed = (c.env?.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return cors({
    origin: (origin) => (allowed.includes(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })(c, next);
});

api.get('/health', (c) =>
  c.json({ ok: true, service: 'rk-associate-api', env: c.env?.APP_ENV ?? 'unknown' })
);

api.route('/auth', auth);

api.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message || 'error' }, err.status);
  }
  console.error('Unhandled API error', err);
  return c.json({ error: 'internal_error' }, 500);
});

export default api;
