# RK Associates · Phase 2 Master Plan

Owner: prakhar · Client: RK Associates (Sneha Sarkar) · Budget: 9 working days
Rule for this phase: **reuse proven open-source pieces, don't hand-roll** (auth, crypto, routing, validation, PDFs, emails).

## 1. Honest starting point (audit, 31 Oct 2026)

The Phase 1 frontend (`src/index.js`) is live and fine. The Phase 2 "70% backend" is a prototype and can't ship as-is:

| File | Problem | Decision |
|---|---|---|
| `phase2-schema.sql` | Uses MySQL `INDEX ...` inside `CREATE TABLE`; invalid in Postgres, will not run on Supabase. Own `users.password_hash` table duplicates Supabase Auth. | Rewrite as Supabase migrations under `supabase/migrations/`, keyed to `auth.users`, with RLS. |
| `phase2-api.js` | Passwords stored as `btoa(password)`; JWT "signature" is base64 of the payload (anyone can forge admin). Razorpay signature never verified. Keys hard-coded. Anon key used for writes. | Replace with Supabase Auth + Hono API. Keep endpoint list as the spec. |
| `worker-combined.js` | Copy of the above plus pages; `Access-Control-Allow-Origin: *`. | Retire after slice 2. |
| `wrangler.toml` | Wrangler v1 format (`type = "javascript"`, empty zone). | Modernise (v3/v4 format, bindings, secrets). |

## 2. Architecture (all reusable building blocks)

```
Browser ──► Cloudflare Worker "rk-associate"  (one deploy, same origin)
             ├─ /api/*  → Hono app (src/api/)        ← backend thread
             └─ /*      → src/index.js page renderers ← frontend thread
                     │
                     ├─ Supabase: Postgres + Auth (email/password, reset, email confirm) + RLS
                     ├─ Cloudflare R2 binding: FILES (ticket attachments, certificates)
                     ├─ Razorpay Orders API + Checkout.js + webhook (HMAC via Web Crypto)
                     └─ SendGrid v3 Mail Send REST (transactional mails)
```

| Need | Reused library / service | Why |
|---|---|---|
| Routing, middleware, CORS, secure headers | **Hono** (`hono`) | First-class Workers framework; built-in `cors`, `secureHeaders`, `bearerAuth`-style middleware. |
| Input validation | **zod** + `@hono/zod-validator` | Typed request validation, no hand-written checks. |
| Auth, password hashing, JWT, reset mails | **Supabase Auth** via `@supabase/supabase-js` | Removes all custom crypto. Worker verifies the user with `supabase.auth.getUser(token)`. |
| DB access + authorisation | **supabase-js + Postgres RLS** | Per-user rules live in the DB, not in route code. |
| Payments | **Razorpay Checkout.js** (frontend) + Orders REST + `X-Razorpay-Signature` webhook check (Web Crypto HMAC) | Official flow; Razorpay Node SDK isn't Workers-compatible, REST is. |
| Email | **SendGrid v3 REST** (dynamic templates) | Plain `fetch`, no SDK needed. Fallback: Resend / AWS SES. |
| Files | **R2 Worker binding** | Native; no S3 SDK needed. |
| Certificates | **pdf-lib** | Generates PDFs inside Workers. |
| Rate limiting | **Cloudflare Rate Limiting binding** | Platform feature, no code. |
| Tests | **Vitest** + **@cloudflare/vitest-pool-workers** | Runs tests inside the real Workers runtime. |
| Deploy/CI | **Wrangler** + GitHub Actions (`cloudflare/wrangler-action`) | Standard. |

## 3. Slices (each = one PR, independently deployable)

| # | Slice | Delivers | Needs from prakhar | Day |
|---|---|---|---|---|
| 0 | **Plan + scaffold** | This doc; Hono API skeleton at `/api/health`; modern `wrangler.toml`; Vitest; fixed SQL migrations | — | 1 |
| 1 | **Database live** | Supabase project created, migrations applied, RLS on, 4 courses + 8 resources seeded, advisors clean | OK to create a Supabase project (free tier) | 1 |
| 2 | **Auth** | `/api/auth/register`, `/login`, `/logout`, `/me`, password reset; `requireUser` / `requireRole('admin')` middleware | Supabase keys as Worker secrets | 2 |
| 3 | **Courses & enrolments** | `/api/courses`, `/api/courses/:slug`, `/api/me/enrollments`, progress update | — | 3 |
| 4 | **Payments (test mode)** | `/api/payments/order`, `/api/payments/verify`, `/api/webhooks/razorpay`; enrolment flips to paid | Razorpay **test** keys (connector sign-in expired) | 3–4 |
| 5 | **Tickets** | Create/list/get/comment/status; ticket numbers; admin assignment | — | 4 |
| 6 | **Files (R2)** | Upload (size/type limits), signed download, per-ticket listing | OK to create R2 bucket `rk-associate-files` | 5 |
| 7 | **Email** | SendGrid templates: welcome, payment receipt, ticket created/updated | SendGrid API key + verified sender | 5 |
| 8 | **Admin API** | Users, enrolments, payments, tickets dashboards, CSV export | — | 6 |
| 9 | **Certificates** | pdf-lib certificate on completion, public verify URL | Logo/signature image | 6 |
| 10 | **Frontend wiring** | Small `app.js` client: forms → API, session handling, Razorpay Checkout | coordinate with frontend redesign thread | 7 |
| 11 | **QA & security** | Endpoint test suite green, RLS tests, rate limits, CSP/secure headers, OWASP checklist, Supabase advisors | — | 8 |
| 12 | **Go-live & handover** | Live Razorpay keys, custom domain, monitoring, backup policy, handover doc for client | Live keys, domain DNS, client sign-off | 9 |

Every slice: code + Vitest tests + PR. Steps that touch production or money (live keys, domain, emails to the client) wait for prakhar's explicit go-ahead.

## 4. Secrets (Worker secrets via `wrangler secret put`, never in git)

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`. R2 uses a binding, so no R2 access keys are needed. A template lives in `.dev.vars.example`.

## 5. Ownership / coordination

- `src/index.js` (page HTML/CSS): frontend redesign thread (premium white + Apple red).
- `src/worker.js`, `src/api/**`, `supabase/**`, `wrangler.toml`, `package.json`, `test/**`: backend thread.

## 6. Risks

- Razorpay connector sign-in expired; SendGrid not connected. Slices 4 and 7 build against test mode / mocks until keys arrive.
- Course content from client due within a week of signing; seed data uses current site copy until then.
- Supabase free tier pauses after 7 days idle; move to Pro (~$25/mo) before go-live, which fits inside the ₹2,000/month infra line only partly; flag to client.
