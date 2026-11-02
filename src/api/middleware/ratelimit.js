import { createMiddleware } from 'hono/factory';

/** Uses the Workers Rate Limiting binding; no-op if the binding is missing (e.g. local dev). */
export const rateLimit = (bindingName, scope) =>
  createMiddleware(async (c, next) => {
    const limiter = c.env?.[bindingName];
    if (limiter) {
      const ip = c.req.header('CF-Connecting-IP') || 'unknown';
      const { success } = await limiter.limit({ key: `${scope}:${ip}` });
      if (!success) return c.json({ error: 'too_many_requests' }, 429, { 'Retry-After': '60' });
    }
    await next();
  });
