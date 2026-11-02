import { describe, it, expect, afterEach, vi } from 'vitest';
import { fetchApp, postJson, mockSupabase, fakeUser } from './helpers.js';
import { _hmacHex } from '../src/api/lib/razorpay.js';

afterEach(() => vi.restoreAllMocks());

const authed = { Authorization: 'Bearer at-123' };
const userRoutes = {
  'GET /auth/v1/user': () => [200, fakeUser],
  'GET /rest/v1/profiles': () => [200, { id: fakeUser.id, role: 'student', status: 'active', full_name: 'Asha' }],
};
const course = { id: 'c1', slug: 'hr', title: 'Professional HR Course', price_paise: 499900 };

describe('POST /api/payments/order', () => {
  it('creates a Razorpay order using the DB price', async () => {
    const calls = mockSupabase({
      ...userRoutes,
      'GET /rest/v1/courses': () => [200, course],
      'POST /rest/v1/enrollments': () => [200, { id: 'e1-0000', payment_status: 'pending' }],
      'RZP POST /v1/orders': ({ body }) => [200, { id: 'order_X', amount: body.amount, currency: 'INR' }],
      'POST /rest/v1/payments': () => [201, null],
    });
    const res = await postJson('/api/payments/order', { course_slug: 'hr', amount: 1 }, authed);
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ order_id: 'order_X', amount: 499900, key_id: 'rzp_test_abc' });
    const rzp = calls.find((c) => c.key === 'RZP POST /v1/orders');
    expect(rzp.body.amount).toBe(499900);
    expect(rzp.headers.get('authorization')).toBe('Basic ' + btoa('rzp_test_abc:rzp_secret'));
  });

  it('409 when already paid', async () => {
    mockSupabase({
      ...userRoutes,
      'GET /rest/v1/courses': () => [200, course],
      'POST /rest/v1/enrollments': () => [200, { id: 'e1', payment_status: 'paid' }],
    });
    const res = await postJson('/api/payments/order', { course_slug: 'hr' }, authed);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/payments/verify', () => {
  const body = async (sigSecret = 'rzp_secret') => ({
    razorpay_order_id: 'order_X',
    razorpay_payment_id: 'pay_Y',
    razorpay_signature: await _hmacHex(sigSecret, 'order_X|pay_Y'),
  });

  it('rejects a forged signature', async () => {
    mockSupabase(userRoutes);
    const res = await postJson('/api/payments/verify', await body('wrong'), authed);
    expect(res.status).toBe(400);
  });

  it('marks paid and activates enrolment on a valid signature', async () => {
    const calls = mockSupabase({
      ...userRoutes,
      'GET /rest/v1/payments': () => [200, { id: 'p1', user_id: fakeUser.id, enrollment_id: 'e1', status: 'created' }],
      'PATCH /rest/v1/payments': () => [204, null],
      'PATCH /rest/v1/enrollments': () => [204, null],
    });
    const res = await postJson('/api/payments/verify', await body(), authed);
    expect(res.status).toBe(200);
    const enr = calls.find((c) => c.key === 'PATCH /rest/v1/enrollments');
    expect(enr.body).toEqual({ payment_status: 'paid', status: 'active' });
  });

  it("can't confirm someone else's order", async () => {
    mockSupabase({ ...userRoutes, 'GET /rest/v1/payments': () => [200, { id: 'p1', user_id: 'someone-else' }] });
    const res = await postJson('/api/payments/verify', await body(), authed);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/webhooks/razorpay', () => {
  const event = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_Y', order_id: 'order_X', method: 'upi' } } } });

  it('rejects unsigned webhooks', async () => {
    const res = await fetchApp('/api/webhooks/razorpay', { method: 'POST', body: event, headers: { 'X-Razorpay-Signature': 'bad' } });
    expect(res.status).toBe(401);
  });

  it('is idempotent when the payment is already paid', async () => {
    const calls = mockSupabase({ 'GET /rest/v1/payments': () => [200, { id: 'p1', enrollment_id: 'e1', status: 'paid' }] });
    const sig = await _hmacHex('whsec', event);
    const res = await fetchApp('/api/webhooks/razorpay', { method: 'POST', body: event, headers: { 'X-Razorpay-Signature': sig } });
    expect(res.status).toBe(200);
    expect(calls.filter((c) => c.key.startsWith('PATCH'))).toHaveLength(0);
  });
});
