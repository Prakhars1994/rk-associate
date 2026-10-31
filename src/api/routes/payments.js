import { Hono } from 'hono';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { serviceClient } from '../lib/supabase.js';
import { validate, unwrap } from '../lib/validate.js';
import { requireUser } from '../middleware/auth.js';
import { queueEmail, templates } from '../lib/email.js';
import { createOrder, verifyPaymentSignature, verifyWebhookSignature } from '../lib/razorpay.js';

/**
 * Marks a payment paid and activates its enrolment. Idempotent: safe to call from both
 * the checkout callback and the webhook, in either order.
 */
export async function markPaid(svc, orderId, { paymentId, method, raw } = {}, c = null) {
  const payment = unwrap(await svc.from('payments').select('id, enrollment_id, status, amount_paise, user:profiles(email, full_name), enrollment:enrollments(course:courses(title))').eq('razorpay_order_id', orderId).maybeSingle());
  if (!payment) return null;
  payment.newlyPaid = payment.status !== 'paid';
  if (payment.newlyPaid) {
    unwrap(await svc.from('payments').update({ status: 'paid', razorpay_payment_id: paymentId ?? null, method: method ?? null, raw: raw ?? null }).eq('id', payment.id));
    unwrap(await svc.from('enrollments').update({ payment_status: 'paid', status: 'active' }).eq('id', payment.enrollment_id).neq('status', 'completed'));
    if (c) {
      queueEmail(c, payment.user?.email, templates.paymentReceipt({
        name: payment.user?.full_name, course: payment.enrollment?.course?.title || 'your course', amount_paise: payment.amount_paise, order_id: orderId,
      }));
    }
  }
  return payment;
}

export const payments = new Hono();

payments.post('/order', requireUser, validate('json', z.object({ course_slug: z.string().regex(/^[a-z0-9-]{1,60}$/) })), async (c) => {
  if (!c.env.RAZORPAY_KEY_ID || !c.env.RAZORPAY_KEY_SECRET) throw new HTTPException(503, { message: 'payments_not_configured' });
  const { course_slug } = c.req.valid('json');
  const user = c.get('user');
  const svc = serviceClient(c.env);

  const course = unwrap(await svc.from('courses').select('id, slug, title, price_paise').eq('slug', course_slug).eq('status', 'active').maybeSingle());
  if (!course) throw new HTTPException(404, { message: 'course_not_found' });

  const enrollment = unwrap(
    await svc.from('enrollments')
      .upsert({ user_id: user.id, course_id: course.id }, { onConflict: 'user_id,course_id' })
      .select('id, payment_status')
      .single()
  );
  if (enrollment.payment_status === 'paid') throw new HTTPException(409, { message: 'already_enrolled' });

  // Price always comes from the database, never from the browser.
  const order = await createOrder(c.env, {
    amount: course.price_paise,
    receipt: `enr_${enrollment.id.slice(0, 30)}`,
    notes: { enrollment_id: enrollment.id, user_id: user.id, course: course.slug },
  });
  unwrap(await svc.from('payments').insert({
    enrollment_id: enrollment.id, user_id: user.id, amount_paise: course.price_paise, currency: order.currency, razorpay_order_id: order.id, status: 'created',
  }));

  return c.json({
    key_id: c.env.RAZORPAY_KEY_ID,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    course: { slug: course.slug, title: course.title },
    prefill: { email: user.email, name: c.get('profile')?.full_name || '' },
  }, 201);
});

payments.post('/verify', requireUser, validate('json', z.object({
  razorpay_order_id: z.string().min(5).max(64),
  razorpay_payment_id: z.string().min(5).max(64),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
})), async (c) => {
  const body = c.req.valid('json');
  const ok = await verifyPaymentSignature(c.env, { orderId: body.razorpay_order_id, paymentId: body.razorpay_payment_id, signature: body.razorpay_signature });
  if (!ok) throw new HTTPException(400, { message: 'invalid_signature' });

  const svc = serviceClient(c.env);
  const owned = unwrap(await svc.from('payments').select('id, user_id').eq('razorpay_order_id', body.razorpay_order_id).maybeSingle());
  if (!owned || owned.user_id !== c.get('user').id) throw new HTTPException(404, { message: 'payment_not_found' });

  const payment = await markPaid(svc, body.razorpay_order_id, { paymentId: body.razorpay_payment_id }, c);
  return c.json({ ok: true, enrollment_id: payment.enrollment_id });
});

/** Razorpay -> us. Mounted at /api/webhooks/razorpay. Configure events: payment.captured, payment.failed, order.paid. */
export const razorpayWebhook = new Hono();

razorpayWebhook.post('/', async (c) => {
  const raw = await c.req.text();
  const valid = await verifyWebhookSignature(c.env, raw, c.req.header('X-Razorpay-Signature'));
  if (!valid) throw new HTTPException(401, { message: 'invalid_signature' });

  const event = JSON.parse(raw);
  const entity = event?.payload?.payment?.entity;
  const svc = serviceClient(c.env);

  if ((event.event === 'payment.captured' || event.event === 'order.paid') && entity?.order_id) {
    await markPaid(svc, entity.order_id, { paymentId: entity.id, method: entity.method, raw: event }, c);
  } else if (event.event === 'payment.failed' && entity?.order_id) {
    unwrap(await svc.from('payments').update({ status: 'failed', razorpay_payment_id: entity.id, raw: event }).eq('razorpay_order_id', entity.order_id).neq('status', 'paid'));
  }
  return c.json({ ok: true });
});
