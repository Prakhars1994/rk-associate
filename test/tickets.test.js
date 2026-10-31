import { describe, it, expect, afterEach, vi } from 'vitest';
import { fetchApp, postJson, mockSupabase, fakeUser } from './helpers.js';

afterEach(() => vi.restoreAllMocks());

const authed = { Authorization: 'Bearer at-123' };
const as = (role) => ({
  'GET /auth/v1/user': () => [200, fakeUser],
  'GET /rest/v1/profiles': () => [200, { id: fakeUser.id, role, status: 'active' }],
});
const TID = '0b6f1c2e-8a4d-4c1b-9f3e-2d7a5b6c8e90';

describe('tickets', () => {
  it('client creates a ticket owned by themselves', async () => {
    const calls = mockSupabase({ ...as('client'), 'POST /rest/v1/tickets': () => [201, { id: TID, ticket_number: 'RK-1001', status: 'open' }] });
    const res = await postJson('/api/tickets', { category: 'payroll', subject: 'Salary slip', description: 'Missing PF deduction', client_id: 'someone-else' }, authed);
    expect(res.status).toBe(201);
    expect((await res.json()).ticket.ticket_number).toBe('RK-1001');
    expect(calls.find((c) => c.key === 'POST /rest/v1/tickets').body.client_id).toBe(fakeUser.id);
  });

  it('validates category', async () => {
    mockSupabase(as('client'));
    const res = await postJson('/api/tickets', { category: 'pizza', subject: 'Hi there', description: 'hello world' }, authed);
    expect(res.status).toBe(400);
  });

  it('lists tickets with paging', async () => {
    const calls = mockSupabase({ ...as('client'), 'GET /rest/v1/tickets': () => [200, [{ id: TID }]] });
    const res = await fetchApp('/api/tickets?status=open&page=2&per_page=10', { headers: authed });
    expect(res.status).toBe(200);
    expect(calls.find((c) => c.key === 'GET /rest/v1/tickets').url.searchParams.get('status')).toBe('eq.open');
  });

  it('clients cannot post internal notes', async () => {
    mockSupabase(as('client'));
    const res = await postJson(`/api/tickets/${TID}/comments`, { body: 'secret', is_internal: true }, authed);
    expect(res.status).toBe(403);
  });

  it('only staff can change status', async () => {
    mockSupabase(as('client'));
    const res = await fetchApp(`/api/tickets/${TID}`, { method: 'PATCH', headers: { ...authed, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'closed' }) });
    expect(res.status).toBe(403);
  });

  it('admin resolves a ticket and resolved_at is stamped', async () => {
    const calls = mockSupabase({ ...as('admin'), 'PATCH /rest/v1/tickets': () => [200, { id: TID, status: 'resolved' }] });
    const res = await fetchApp(`/api/tickets/${TID}`, { method: 'PATCH', headers: { ...authed, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'resolved' }) });
    expect(res.status).toBe(200);
    expect(calls.find((c) => c.key === 'PATCH /rest/v1/tickets').body.resolved_at).toBeTruthy();
  });
});
