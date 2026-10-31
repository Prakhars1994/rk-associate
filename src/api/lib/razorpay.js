// Razorpay over REST (the official Node SDK depends on Node http and isn't Workers-friendly).
// Docs: https://razorpay.com/docs/api/orders/ and https://razorpay.com/docs/webhooks/validate-test/

const API = 'https://api.razorpay.com/v1';

export async function createOrder(env, { amount, currency = 'INR', receipt, notes }) {
  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`),
    },
    body: JSON.stringify({ amount, currency, receipt, notes }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`razorpay_order_failed: ${body?.error?.description || res.status}`);
    err.cause = body;
    throw err;
  }
  return body;
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a || '');
  const y = enc.encode(b || '');
  if (x.byteLength !== y.byteLength) return false;
  return crypto.subtle.timingSafeEqual(x, y);
}

/** Checkout handler signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export async function verifyPaymentSignature(env, { orderId, paymentId, signature }) {
  return safeEqual(await hmacHex(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`), signature);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret). */
export async function verifyWebhookSignature(env, rawBody, signature) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  return safeEqual(await hmacHex(env.RAZORPAY_WEBHOOK_SECRET, rawBody), signature);
}

export { hmacHex as _hmacHex };
