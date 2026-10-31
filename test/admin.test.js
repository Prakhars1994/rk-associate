import { describe, it, expect, afterEach, vi } from 'vitest';
import { fetchApp, mockSupabase, fakeUser } from './helpers.js';
import { toCsv } from '../src/api/routes/admin.js';

afterEach(() => vi.restoreAllMocks());

const authed = { Authorization: 'Bearer at-123' };
const as = (role) => ({
  'GET /auth/v1/user': () => [200, fakeUser],
  'GET /rest/v1/profiles': () => [200, { id: fakeUser.id, role, status: 'active' }],
});
const json = (method, body) => ({ method, headers: { ...authed, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('admin API', () => {
  it('forbidden for non-admins', async () => {
    mockSupabase(as('client'));
    expect((await fetchApp('/api/admin/stats', { headers: authed })).status).toBe(403);
  });

  it('stats sum revenue from paid payments', async () => {
    mockSupabase({
      'GET /auth/v1/user': () => [200, fakeUser],
      'GET /rest/v1/profiles': ({ headers }) => headers.get('authorization') === 'Bearer at-123'
        ? [200, { id: fakeUser.id, role: 'admin', status: 'active' }] : [200, []],
      'HEAD /rest/v1/': () => [200, []],
      'GET /rest/v1/enrollments': () => [200, []],
      'GET /rest/v1/tickets': () => [200, []],
      'GET /rest/v1/payments': () => [200, [{ amount_paise: 499900 }, { amount_paise: 699900 }]],
    });
    const res = await fetchApp('/api/admin/stats', { headers: authed });
    expect(res.status).toBe(200);
    expect((await res.json()).revenue_paise).toBe(1199800);
  });

  it('admins cannot demote themselves', async () => {
    mockSupabase(as('admin'));
    const res = await fetchApp(`/api/admin/users/${fakeUser.id}`, json('PATCH', { role: 'student' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('cannot_change_own_account');
  });

  it('CSV export neutralises formulas', () => {
    const csv = toCsv([{ name: '=HYPERLINK("x")', n: 1 }]);
    expect(csv).toBe(`name,n\n"'=HYPERLINK(""x"")","1"`);
  });
});
