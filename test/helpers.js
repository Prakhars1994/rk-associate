import { exports } from 'cloudflare:workers';
import { vi } from 'vitest';

export const fetchApp = (path, init) => exports.default.fetch(new Request(`https://example.com${path}`, init));

export const postJson = (path, body, headers = {}) =>
  fetchApp(path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

/**
 * Fakes Supabase over HTTP. `routes` maps "METHOD /path" (prefix match) to a handler
 * returning [status, body]. Unmatched calls fail the test loudly.
 */
export function mockSupabase(routes) {
  const calls = [];
  const real = globalThis.fetch;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const req = new Request(input, init);
    const url = new URL(req.url);
    if (url.origin !== 'https://sb.test' && url.origin !== 'https://api.razorpay.com') return real(input, init);
    const prefix = url.origin === 'https://api.razorpay.com' ? 'RZP ' : '';
    const key = `${prefix}${req.method} ${url.pathname}`;
    const body = req.method === 'GET' ? null : await req.clone().json().catch(() => null);
    calls.push({ key, url, body, headers: req.headers });
    const match = Object.keys(routes).find((k) => key.startsWith(k));
    if (!match) return new Response(JSON.stringify({ message: `unmocked ${key}` }), { status: 500 });
    const [status, json] = await routes[match]({ url, body, headers: req.headers });
    if (status === 204) return new Response(null, { status });
    return new Response(JSON.stringify(json), { status, headers: { 'Content-Type': 'application/json' } });
  });
  return calls;
}

export const fakeUser = { id: '7d1e4c3a-2b5f-4a6e-9c8d-0f1a2b3c4d5e', email: 'asha@example.com', aud: 'authenticated', role: 'authenticated' };
export const fakeSession = { access_token: 'at-123', refresh_token: 'rt-456', expires_in: 3600, expires_at: 9999999999, token_type: 'bearer', user: fakeUser };
