import { exports } from 'cloudflare:workers';
import { describe, it, expect } from 'vitest';

const fetchApp = (path, init) => exports.default.fetch(new Request(`https://example.com${path}`, init));

describe('API scaffold', () => {
  it('GET /api/health returns ok', async () => {
    const res = await fetchApp('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, service: 'rk-associate-api' });
  });

  it('sets secure headers on API responses', async () => {
    const res = await fetchApp('/api/health');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('unknown API route returns JSON 404', async () => {
    const res = await fetchApp('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });

  it('does not echo CORS for unknown origins', async () => {
    const res = await fetchApp('/api/health', { headers: { Origin: 'https://evil.example' } });
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('allows the live site origin', async () => {
    const res = await fetchApp('/api/health', { headers: { Origin: 'https://rk-associate.vliab.workers.dev' } });
    expect(res.headers.get('access-control-allow-origin')).toBe('https://rk-associate.vliab.workers.dev');
  });

  it('is API-only (no pages)', async () => {
    const res = await fetchApp('/login');
    expect(res.status).toBe(404);
  });
});
