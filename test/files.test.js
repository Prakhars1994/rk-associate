import { env } from 'cloudflare:workers';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { fetchApp, mockSupabase, fakeUser } from './helpers.js';

afterEach(() => vi.restoreAllMocks());

const authed = { Authorization: 'Bearer at-123' };
const userRoutes = {
  'GET /auth/v1/user': () => [200, fakeUser],
  'GET /rest/v1/profiles': () => [200, { id: fakeUser.id, role: 'client', status: 'active' }],
};
const FID = '0b6f1c2e-8a4d-4c1b-9f3e-2d7a5b6c8e90';

const upload = (file, extra = {}) => {
  const fd = new FormData();
  fd.append('file', file);
  for (const [k, v] of Object.entries(extra)) fd.append(k, v);
  return fetchApp('/api/files', { method: 'POST', headers: authed, body: fd });
};

describe('files', () => {
  it('uploads to R2 and records metadata', async () => {
    const calls = mockSupabase({ ...userRoutes, 'POST /rest/v1/files': ({ body }) => [201, { id: FID, ...body }] });
    const res = await upload(new File(['%PDF-1.4 hello'], 'Salary Slip <Oct>.pdf', { type: 'application/pdf' }));
    expect(res.status).toBe(201);
    const row = calls.find((c) => c.key === 'POST /rest/v1/files').body;
    expect(row.file_name).toBe('Salary Slip _Oct_.pdf');
    expect(row.r2_key.startsWith(`u/${fakeUser.id}/`)).toBe(true);
    expect(await (await env.FILES.get(row.r2_key)).text()).toBe('%PDF-1.4 hello');
  });

  it('rejects disallowed types', async () => {
    mockSupabase(userRoutes);
    const res = await upload(new File(['<script>'], 'x.html', { type: 'text/html' }));
    expect(res.status).toBe(415);
  });

  it('rejects files over 10 MB', async () => {
    mockSupabase(userRoutes);
    const res = await upload(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.pdf', { type: 'application/pdf' }));
    expect(res.status).toBe(413);
  });

  it('404 when RLS hides the file', async () => {
    mockSupabase({ ...userRoutes, 'GET /rest/v1/files': () => [200, null] });
    const res = await fetchApp(`/api/files/${FID}/download`, { headers: authed });
    expect(res.status).toBe(404);
  });

  it('downloads as an attachment', async () => {
    await env.FILES.put('u/x/y/a.txt', 'hi');
    mockSupabase({ ...userRoutes, 'GET /rest/v1/files': () => [200, { r2_key: 'u/x/y/a.txt', file_name: 'a.txt', content_type: 'text/plain' }] });
    const res = await fetchApp(`/api/files/${FID}/download`, { headers: authed });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="a.txt"');
    expect(await res.text()).toBe('hi');
  });
});
