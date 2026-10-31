// SendGrid v3 Mail Send over REST: https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send
// Emails never block a request: call via c.executionCtx.waitUntil(sendEmail(...)).

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const rupees = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1d1d1f">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<div style="font-weight:700;font-size:18px;color:#d70015;margin-bottom:24px">RK Associates</div>
<h1 style="font-size:22px;margin:0 0 16px">${esc(title)}</h1>${bodyHtml}
<p style="margin-top:32px;font-size:12px;color:#86868b">RK Associates · Mandideep, MP · hr@rkassociate.com · +91 96856 88099</p>
</div></body></html>`;
}

export const templates = {
  paymentReceipt: ({ name, course, amount_paise, order_id }) => ({
    subject: `Payment received: ${course}`,
    html: layout('Payment received', `<p>Hi ${esc(name) || 'there'},</p><p>We've received ${esc(rupees(amount_paise))} for <b>${esc(course)}</b>. Your course is now unlocked in your dashboard.</p><p style="color:#86868b;font-size:13px">Order ${esc(order_id)}</p>`),
  }),
  ticketCreated: ({ name, ticket_number, subject }) => ({
    subject: `[${ticket_number}] We've got your request`,
    html: layout(`Ticket ${ticket_number} received`, `<p>Hi ${esc(name) || 'there'},</p><p>Thanks for reaching out about <b>${esc(subject)}</b>. Our team will reply soon; you can follow it in your client portal.</p>`),
  }),
  ticketReply: ({ name, ticket_number, subject }) => ({
    subject: `[${ticket_number}] New reply on your ticket`,
    html: layout(`New reply on ${ticket_number}`, `<p>Hi ${esc(name) || 'there'},</p><p>Our team replied to <b>${esc(subject)}</b>. Open your client portal to read it.</p>`),
  }),
};

export async function sendEmail(env, { to, subject, html }) {
  if (!env.SENDGRID_API_KEY || !env.SENDGRID_FROM_EMAIL) {
    console.warn('email skipped: SendGrid not configured', subject);
    return { skipped: true };
  }
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: env.SENDGRID_FROM_EMAIL, name: 'RK Associates' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  if (!res.ok) console.error('sendgrid failed', res.status, await res.text().catch(() => ''));
  return { ok: res.ok, status: res.status };
}

/** Fire-and-forget helper that never throws into the request. */
export function queueEmail(c, to, template) {
  if (!to) return;
  const p = sendEmail(c.env, { to, ...template }).catch((e) => console.error('email error', e));
  try { c.executionCtx.waitUntil(p); } catch { /* not in a request context (tests) */ }
}
