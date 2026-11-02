import { describe, it, expect, afterEach, vi } from 'vitest';
import { postJson, mockSupabase, fakeUser } from './helpers.js';
import { templates, sendEmail } from '../src/api/lib/email.js';
import { _hmacHex } from '../src/api/lib/razorpay.js';

afterEach(() => vi.restoreAllMocks());

describe('email', () => {
  it('escapes user content in templates', () => {
    const { html } = templates.ticketCreated({ name: '<img onerror=x>', ticket_number: 'RK-1', subject: '<b>hi</b>' });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;b&gt;hi&lt;/b&gt;');
  });

  it('skips quietly when SendGrid is not configured', async () => {
    expect(await sendEmail({}, { to: 'a@b.com', subject: 's', html: 'h' })).toEqual({ skipped: true });
  });

  it('sends a receipt the first time a payment is marked paid', async () => {
    const calls = mockSupabase({
      'GET /auth/v1/user': () => [200, fakeUser],
      'GET /rest/v1/profiles': () => [200, { id: fakeUser.id, role: 'student', status: 'active' }],
      'GET /rest/v1/payments': () => [200, { id: 'p1', user_id: fakeUser.id, enrollment_id: 'e1', status: 'created', amount_paise: 499900, user: { email: 'asha@example.com', full_name: 'Asha' }, enrollment: { course: { title: 'Professional HR Course' } } }],
      'PATCH /rest/v1/': () => [204, null],
      'SG POST /v3/mail/send': () => [202, {}],
    });
    const res = await postJson('/api/payments/verify', {
      razorpay_order_id: 'order_X', razorpay_payment_id: 'pay_Y', razorpay_signature: await _hmacHex('rzp_secret', 'order_X|pay_Y'),
    }, { Authorization: 'Bearer at-123' });
    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 20));
    const mail = calls.find((c) => c.key === 'SG POST /v3/mail/send');
    expect(mail.body.personalizations[0].to[0].email).toBe('asha@example.com');
    expect(mail.body.subject).toContain('Professional HR Course');
  });
});
