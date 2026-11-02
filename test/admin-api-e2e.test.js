import { describe, it, expect, vi } from 'vitest';
import { fetchApp, mockSupabase, fakeUser } from './helpers.js';

// Admin user credentials for testing
const adminUser = { ...fakeUser, id: 'f59955e9-360a-493a-92d0-243f2788abbb', email: 'prakhars389@gmail.com' };
const adminToken = 'admin-test-token-123';
const adminHeaders = { Authorization: `Bearer ${adminToken}` };

// Test module ID from E2E testing
const testModuleId = '79f87420-97a8-4db3-b4b8-f1a6fbc05edd';
const nonExistentModuleId = '00000000-0000-0000-0000-000000000000';
const hrCourseId = 'abcf1efb-996d-43a1-9021-c6a05b0834b2';

const adminMocks = {
  'GET /auth/v1/user': ({ headers }) =>
    headers.get('authorization') === `Bearer ${adminToken}` ? [200, { user: adminUser }] : [401, { error: 'unauthorized' }],
  'GET /rest/v1/profiles': ({ url }) => {
    // Match query for admin user's profile
    if (url.searchParams.get('id') === `eq.${adminUser.id}`) {
      return [200, [{ id: adminUser.id, role: 'admin', status: 'active' }]];
    }
    return [200, []];
  },
};

describe('Admin API E2E', () => {
  it('adds YouTube content to course module', async () => {
    const calls = mockSupabase({
      ...adminMocks,
      'GET /rest/v1/course_modules': ({ url }) =>
        url.searchParams.get('id') === `eq.${testModuleId}` ? [200, [{ id: testModuleId, course_id: hrCourseId }]] : [200, []],
      'POST /rest/v1/course_module_content': () => [201, {
        id: 'content-123',
        module_id: testModuleId,
        content_type: 'youtube_link',
        content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      }],
    });

    const res = await fetchApp(`/api/admin/modules/${testModuleId}/youtube`, {
      method: 'POST',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        video_title: 'HR Basics',
      }),
    });

    if (res.status !== 201) {
      const text = await res.text();
      console.log('Calls made:', calls.map(c => ({ ...c, body: c.body ? JSON.stringify(c.body) : null })));
      console.log('Error response:', text);
    }

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.content).toBeDefined();
    expect(data.content.content_type).toBe('youtube_link');
  });

  it('requires admin role', async () => {
    const studentUser = { ...fakeUser, id: 'student-123' };
    mockSupabase({
      'GET /auth/v1/user': () => [200, studentUser],
      'GET /rest/v1/profiles': () => [200, { id: studentUser.id, role: 'student', status: 'active' }],
    });

    const res = await fetchApp(`/api/admin/modules/${testModuleId}/youtube`, {
      method: 'POST',
      headers: { Authorization: 'Bearer student-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }),
    });

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent module', async () => {
    mockSupabase({
      ...adminMocks,
      'GET /rest/v1/course_modules': ({ url }) => 
        url.searchParams.get('id') === `eq.${nonExistentModuleId}` ? [200, []] : [200, []],
    });

    const res = await fetchApp(`/api/admin/modules/${nonExistentModuleId}/youtube`, {
      method: 'POST',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }),
    });

    expect(res.status).toBe(404);
  });
});
