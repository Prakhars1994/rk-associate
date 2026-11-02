import { describe, it, expect, afterEach, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { mockSupabase, fetchApp, fakeUser } from './helpers.js';
import { runBackup, BACKUP_TABLES } from '../src/backup.js';

afterEach(() => vi.restoreAllMocks());

const jwt = (claims) => ['e30', btoa(JSON.stringify(claims)).replace(/=+$/, ''), 'sig'].join('.');

describe('nightly backup', () => {
  it('writes every table to R2 as gzipped JSON and prunes copies older than 30 days', async () => {
    await env.FILES.put('backups/2026-09-01.json.gz', 'old');
    await env.FILES.put('backups/2026-10-20.json.gz', 'recent');
    const routes = Object.fromEntries(BACKUP_TABLES.map((t) => [`GET /rest/v1/${t}`, () => [200, t === 'enquiries' ? [{ id: 'e1', name: 'Asha' }] : []]]));
    mockSupabase(routes);

    const r = await runBackup(env, new Date('2026-11-02T20:30:00Z'));
    expect(r.key).toBe('backups/2026-11-02.json.gz');
    expect(r.counts.enquiries).toBe(1);
    expect(r.pruned).toBe(1);

    const obj = await env.FILES.get(r.key);
    const json = JSON.parse(await new Response(obj.body.pipeThrough(new DecompressionStream('gzip'))).text());
    expect(json.tables.enquiries[0].name).toBe('Asha');
    expect(Object.keys(json.tables)).toEqual(BACKUP_TABLES);
    expect(await env.FILES.get('backups/2026-09-01.json.gz')).toBeNull();
    expect(await env.FILES.get('backups/2026-10-20.json.gz')).not.toBeNull();
  });

  it('lists backups for admins (two-step session) only', async () => {
    await env.FILES.put('backups/2026-11-01.json.gz', 'x', { customMetadata: { counts: '{"enquiries":3}' } });
    mockSupabase({ 'GET /auth/v1/user': () => [200, fakeUser], 'GET /rest/v1/profiles': () => [200, { id: fakeUser.id, role: 'admin', status: 'active' }] });
    const res = await fetchApp('/api/admin/backups', { headers: { Authorization: `Bearer ${jwt({ aal: 'aal2' })}` } });
    expect(res.status).toBe(200);
    expect((await res.json()).backups.find((b) => b.day === '2026-11-01').counts.enquiries).toBe(3);
    const noMfa = await fetchApp('/api/admin/backups', { headers: { Authorization: `Bearer ${jwt({ aal: 'aal1' })}` } });
    expect(noMfa.status).toBe(403);
  });
});
