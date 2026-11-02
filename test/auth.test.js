import { describe, it, expect, afterEach, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { fetchApp, postJson, mockSupabase, fakeUser, fakeSession } from './helpers.js';

afterEach(() => vi.restoreAllMocks());

describe('POST /api/auth/register', () => {
  it('rejects bad input before calling Supabase', async () => {
    const calls = mockSupabase({});
    const res = await postJson('/api/auth/register', { email: 'nope', password: '123' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_input');
    expect(calls).toHaveLength(0);
  });

  it('refuses to let people sign up as admin', async () => {
    mockSupabase({});
    const res = await postJson('/api/auth/register', { email: 'a@b.com', password: 'longenough', full_name: 'Asha', role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('signs up through Supabase Auth with profile metadata', async () => {
    const calls = mockSupabase({ 'POST /auth/v1/signup': () => [200, { ...fakeUser, identities: [{}] }] });
    const res = await postJson('/api/auth/register', { email: 'Asha@Example.com ', password: 'longenough', full_name: 'Asha Rao', role: 'client' });
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ needs_confirmation: true });
    expect(calls[0].body).toMatchObject({ email: 'asha@example.com', data: { full_name: 'Asha Rao', role: 'client' } });
  });

  it('creates a pre-confirmed user and signs them in when AUTO_CONFIRM_SIGNUPS is on', async () => {
    env.AUTO_CONFIRM_SIGNUPS = 'true';
    try {
      const calls = mockSupabase({
        'POST /auth/v1/admin/users': () => [200, { ...fakeUser, email_confirmed_at: '2026-11-02T00:00:00Z' }],
        'POST /auth/v1/token': () => [200, fakeSession],
      });
      const res = await postJson('/api/auth/register', { email: 'asha@example.com', password: 'longenough', full_name: 'Asha Rao' });
      expect(res.status).toBe(201);
      expect(await res.json()).toMatchObject({ needs_confirmation: false, access_token: 'at-123' });
      expect(calls[0].body).toMatchObject({ email: 'asha@example.com', email_confirm: true, user_metadata: { full_name: 'Asha Rao' } });
      expect(calls.some((x) => x.key === 'POST /auth/v1/signup')).toBe(false);
    } finally {
      env.AUTO_CONFIRM_SIGNUPS = 'false';
    }
  });

  it('reports an existing account when AUTO_CONFIRM_SIGNUPS is on', async () => {
    env.AUTO_CONFIRM_SIGNUPS = 'true';
    try {
      mockSupabase({ 'POST /auth/v1/admin/users': () => [422, { code: 'email_exists', msg: 'exists' }] });
      const res = await postJson('/api/auth/register', { email: 'asha@example.com', password: 'longenough', full_name: 'Asha Rao' });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('user_already_exists');
    } finally {
      env.AUTO_CONFIRM_SIGNUPS = 'false';
    }
  });
});

describe('POST /api/auth/login', () => {
  it('returns a session and sets HttpOnly cookies', async () => {
    mockSupabase({ 'POST /auth/v1/token': () => [200, fakeSession] });
    const res = await postJson('/api/auth/login', { email: 'asha@example.com', password: 'longenough' });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ access_token: 'at-123', user: { id: fakeUser.id } });
    const cookies = res.headers.getSetCookie().join('\n');
    expect(cookies).toMatch(/rk_at=at-123;.*HttpOnly/);
    expect(cookies).toMatch(/rk_rt=rt-456;.*Path=\/api\/auth/);
  });

  it('gives one generic error for bad credentials', async () => {
    mockSupabase({ 'POST /auth/v1/token': () => [400, { error: 'invalid_grant', error_description: 'Invalid login credentials' }] });
    const res = await postJson('/api/auth/login', { email: 'asha@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'invalid_credentials' });
  });
});

describe('GET /api/auth/me', () => {
  it('401 without a token', async () => {
    const res = await fetchApp('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('401 when Supabase rejects the token (forged/expired)', async () => {
    mockSupabase({ 'GET /auth/v1/user': () => [401, { message: 'invalid JWT' }] });
    const res = await fetchApp('/api/auth/me', { headers: { Authorization: 'Bearer forged' } });
    expect(res.status).toBe(401);
  });

  it('returns user and profile for a valid token (cookie or bearer)', async () => {
    const calls = mockSupabase({
      'GET /auth/v1/user': () => [200, fakeUser],
      'GET /rest/v1/profiles': () => [200, { id: fakeUser.id, role: 'student', full_name: 'Asha', status: 'active' }],
    });
    const res = await fetchApp('/api/auth/me', { headers: { Cookie: 'rk_at=at-123' } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ profile: { role: 'student' } });
    // Profile read runs as the user so RLS applies.
    expect(calls.find((c) => c.key.startsWith('GET /rest/v1/profiles')).headers.get('authorization')).toBe('Bearer at-123');
  });

  it('403 for suspended accounts', async () => {
    mockSupabase({
      'GET /auth/v1/user': () => [200, fakeUser],
      'GET /rest/v1/profiles': () => [200, { id: fakeUser.id, role: 'student', status: 'suspended' }],
    });
    const res = await fetchApp('/api/auth/me', { headers: { Authorization: 'Bearer at-123' } });
    expect(res.status).toBe(403);
  });
});

describe('other auth endpoints', () => {
  it('forgot-password always returns ok', async () => {
    mockSupabase({ 'POST /auth/v1/recover': () => [200, {}] });
    const res = await postJson('/api/auth/forgot-password', { email: 'ghost@example.com' });
    expect(res.status).toBe(200);
  });

  it('email links point at the website /login page', async () => {
    const calls = mockSupabase({ 'POST /auth/v1/signup': () => [200, { ...fakeUser, identities: [{}] }], 'POST /auth/v1/recover': () => [200, {}] });
    await postJson('/api/auth/register', { email: 'asha@example.com', password: 'longenough', full_name: 'Asha Rao' });
    await postJson('/api/auth/forgot-password', { email: 'asha@example.com' });
    const call = (key) => calls.find((x) => x.key === key);
    expect(call('POST /auth/v1/signup').url.searchParams.get('redirect_to')).toBe('https://rk-associate.vliab.workers.dev/login?confirmed=1');
    expect(call('POST /auth/v1/recover').url.searchParams.get('redirect_to')).toBe('https://rk-associate.vliab.workers.dev/login?reset=1');
  });

  it('reset-password updates the password with the recovery token', async () => {
    const calls = mockSupabase({ 'PUT /auth/v1/user': () => [200, fakeUser] });
    const res = await postJson('/api/auth/reset-password', { access_token: 'recovery-token-1234567890', password: 'brandnewpass' });
    expect(res.status).toBe(200);
    expect(calls[0].body).toEqual({ password: 'brandnewpass' });
    expect(calls[0].headers.get('Authorization')).toBe('Bearer recovery-token-1234567890');
  });

  it('reset-password reports an expired link', async () => {
    mockSupabase({ 'PUT /auth/v1/user': () => [401, { msg: 'expired' }] });
    const res = await postJson('/api/auth/reset-password', { access_token: 'recovery-token-1234567890', password: 'brandnewpass' });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('reset_link_expired');
  });

  it('logout clears cookies', async () => {
    const res = await postJson('/api/auth/logout', {});
    expect(res.headers.getSetCookie().join('\n')).toMatch(/rk_at=;.*Max-Age=0/);
  });
});

describe('rate limiting', () => {
  it('returns 429 after 10 login attempts a minute from one IP', async () => {
    mockSupabase({ 'POST /auth/v1/token': () => [400, { error: 'invalid_grant' }] });
    const statuses = [];
    for (let i = 0; i < 12; i++) {
      const res = await postJson('/api/auth/login', { email: 'x@example.com', password: 'nope' }, { 'CF-Connecting-IP': '203.0.113.9' });
      statuses.push(res.status);
    }
    expect(statuses).toContain(429);
  });
});
