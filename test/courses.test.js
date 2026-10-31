import { describe, it, expect, afterEach, vi } from 'vitest';
import { fetchApp, postJson, mockSupabase, fakeUser } from './helpers.js';

afterEach(() => vi.restoreAllMocks());

const course = { id: 'c1', slug: 'hr', title: 'Professional HR Course', price_paise: 499900 };
const authed = { Authorization: 'Bearer at-123' };
const userRoutes = {
  'GET /auth/v1/user': () => [200, fakeUser],
  'GET /rest/v1/profiles': () => [200, { id: fakeUser.id, role: 'student', status: 'active' }],
};

describe('catalogue', () => {
  it('lists active courses publicly', async () => {
    const calls = mockSupabase({ 'GET /rest/v1/courses': () => [200, [course]] });
    const res = await fetchApp('/api/courses');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ courses: [course] });
    expect(calls[0].url.searchParams.get('status')).toBe('eq.active');
  });

  it('404s for an unknown course', async () => {
    mockSupabase({ 'GET /rest/v1/courses': () => [200, null] });
    const res = await fetchApp('/api/courses/nope');
    expect(res.status).toBe(404);
  });

  it('rejects odd slugs', async () => {
    const res = await fetchApp('/api/courses/' + encodeURIComponent("hr' or 1=1"));
    expect(res.status).toBe(400);
  });

  it('lists free resources', async () => {
    mockSupabase({ 'GET /rest/v1/free_resources': () => [200, [{ slug: 'qa-sheets' }]] });
    const res = await fetchApp('/api/free-resources');
    expect((await res.json()).resources).toHaveLength(1);
  });
});

describe('learner', () => {
  it('requires login', async () => {
    expect((await fetchApp('/api/me/enrollments')).status).toBe(401);
  });

  it('lists my enrolments', async () => {
    mockSupabase({ ...userRoutes, 'GET /rest/v1/enrollments': () => [200, [{ id: 'e1', course }]] });
    const res = await fetchApp('/api/me/enrollments', { headers: authed });
    expect((await res.json()).enrollments[0].id).toBe('e1');
  });

  it('blocks progress on an unpaid or foreign enrolment (RLS denies insert)', async () => {
    mockSupabase({ ...userRoutes, 'POST /rest/v1/module_progress': () => [403, { code: '42501', message: 'new row violates row-level security policy' }] });
    const res = await postJson('/api/me/enrollments/0b6f1c2e-8a4d-4c1b-9f3e-2d7a5b6c8e90/progress', { module_id: '5c2e9a1b-3d4f-4e6a-8b7c-1f0e2d3c4b5a' }, authed);
    expect(res.status).toBe(403);
  });
});
