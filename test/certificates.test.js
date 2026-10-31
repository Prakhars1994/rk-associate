import { env } from 'cloudflare:workers';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { fetchApp, postJson, mockSupabase, fakeUser } from './helpers.js';

afterEach(() => vi.restoreAllMocks());

const authed = { Authorization: 'Bearer at-123' };
const userRoutes = {
  'GET /auth/v1/user': () => [200, fakeUser],
  'GET /rest/v1/profiles': () => [200, { id: fakeUser.id, role: 'student', status: 'active', full_name: 'Asha Rao' }],
};
const EID = '0b6f1c2e-8a4d-4c1b-9f3e-2d7a5b6c8e90';
const CODE = 'a1b2c3d4e5f60718';

describe('certificates', () => {
  it('refuses before the course is completed', async () => {
    mockSupabase({ ...userRoutes, 'GET /rest/v1/enrollments': () => [200, { id: EID, user_id: fakeUser.id, status: 'active' }] });
    const res = await postJson(`/api/me/enrollments/${EID}/certificate`, {}, authed);
    expect(res.status).toBe(409);
  });

  it('issues a PDF into R2 on completion', async () => {
    mockSupabase({
      ...userRoutes,
      'GET /rest/v1/enrollments': () => [200, { id: EID, user_id: fakeUser.id, course_id: 'c1', status: 'completed', course: { title: 'Professional HR Course' } }],
      'GET /rest/v1/certificates': () => [200, null],
      'POST /rest/v1/certificates': () => [201, { id: 'k1', verification_code: CODE, issued_at: '2026-11-05T00:00:00Z', r2_key: null }],
      'PATCH /rest/v1/certificates': () => [204, null],
    });
    const res = await postJson(`/api/me/enrollments/${EID}/certificate`, {}, authed);
    expect(res.status).toBe(201);
    const pdf = await env.FILES.get(`certificates/${CODE}.pdf`);
    expect(new TextDecoder().decode((await pdf.arrayBuffer()).slice(0, 5))).toBe('%PDF-');
  });

  it('public verification', async () => {
    mockSupabase({ 'GET /rest/v1/certificates': () => [200, { verification_code: CODE, issued_at: 'x', user: { full_name: 'Asha Rao' }, course: { title: 'HR' } }] });
    const res = await fetchApp(`/api/certificates/verify/${CODE}`);
    expect(await res.json()).toMatchObject({ valid: true, name: 'Asha Rao' });
  });

  it('rejects malformed codes', async () => {
    expect((await fetchApp('/api/certificates/verify/zzz')).status).toBe(400);
  });
});
