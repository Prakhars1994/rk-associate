import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const router = new Hono();

// Middleware: require admin role
const requireAdmin = async (c, next) => {
  const user = c.get('user');
  const { data } = await c.env.SUPABASE.from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!data || !['admin', 'trainer'].includes(data.role)) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
};

router.use('*', requireAdmin);

// Schema: course module with content
const CourseModuleSchema = z.object({
  position: z.number().int().positive(),
  title: z.string().min(1),
  content_type: z.enum(['video', 'pdf', 'youtube_link']),
  youtube_url: z.string().url().optional(),
});

// GET /api/admin/courses - list all courses
router.get('/courses', async (c) => {
  const { data, error } = await c.env.SUPABASE
    .from('courses')
    .select('*, course_modules(id, position, title)')
    .order('created_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ courses: data });
});

// GET /api/admin/courses/:slug - get course with all content
router.get('/courses/:slug', async (c) => {
  const { slug } = c.req.param();

  const { data: course, error: courseError } = await c.env.SUPABASE
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single();

  if (courseError) return c.json({ error: 'Course not found' }, 404);

  const { data: modules } = await c.env.SUPABASE
    .from('course_modules')
    .select('*, course_module_content(content_type, content_url, file_id, created_at)')
    .eq('course_id', course.id)
    .order('position');

  const { data: materials } = await c.env.SUPABASE
    .from('course_materials')
    .select('*')
    .eq('course_id', course.id);

  return c.json({ course, modules, materials });
});

// POST /api/admin/courses - create new course
const CreateCourseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9_-]+$/),
  title: z.string().min(1),
  description: z.string().optional(),
  price_paise: z.number().int().nonnegative(),
  duration_days: z.number().int().optional(),
  mode: z.string().optional(),
});

router.post('/courses', zValidator('json', CreateCourseSchema), async (c) => {
  const body = c.req.valid('json');

  const { data, error } = await c.env.SUPABASE
    .from('courses')
    .insert([{ ...body, status: 'draft' }])
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ course: data }, 201);
});

// POST /api/admin/courses/:courseId/modules - add module to course
const AddModuleSchema = z.object({
  position: z.number().int().positive(),
  title: z.string().min(1),
});

router.post('/courses/:courseId/modules', zValidator('json', AddModuleSchema), async (c) => {
  const { courseId } = c.req.param();
  const body = c.req.valid('json');

  const { data, error } = await c.env.SUPABASE
    .from('course_modules')
    .insert([{ course_id: courseId, ...body }])
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ module: data }, 201);
});

// POST /api/admin/modules/:moduleId/youtube - add YouTube link to module
const AddYouTubeSchema = z.object({
  youtube_url: z.string().url(),
  video_title: z.string().optional(),
  description: z.string().optional(),
});

router.post('/modules/:moduleId/youtube', zValidator('json', AddYouTubeSchema), async (c) => {
  const { moduleId } = c.req.param();
  const user = c.get('user');
  const body = c.req.valid('json');

  // Get module to find course_id
  const { data: module } = await c.env.SUPABASE
    .from('course_modules')
    .select('course_id')
    .eq('id', moduleId)
    .single();

  if (!module) return c.json({ error: 'Module not found' }, 404);

  // Add to course_module_content
  const { data: content, error: contentError } = await c.env.SUPABASE
    .from('course_module_content')
    .insert([{
      module_id: moduleId,
      content_type: 'youtube_link',
      content_url: body.youtube_url,
    }])
    .select()
    .single();

  if (contentError) return c.json({ error: contentError.message }, 400);

  // Add to youtube_links table for tracking
  await c.env.SUPABASE.from('youtube_links').insert([{
    course_id: module.course_id,
    module_id: moduleId,
    youtube_url: body.youtube_url,
    video_title: body.video_title,
    description: body.description,
    created_by: user.id,
  }]);

  return c.json({ content }, 201);
});

// POST /api/admin/modules/:moduleId/upload - upload video or PDF
router.post('/modules/:moduleId/upload', async (c) => {
  const { moduleId } = c.req.param();
  const user = c.get('user');
  const formData = await c.req.formData();
  const file = formData.get('file');
  const contentType = formData.get('content_type');

  if (!file || !contentType) {
    return c.json({ error: 'Missing file or content_type' }, 400);
  }

  if (!['video', 'pdf'].includes(contentType)) {
    return c.json({ error: 'Invalid content_type: use video or pdf' }, 400);
  }

  // Validate file type
  const mimeType = file.type;
  const allowedMimes = {
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    pdf: ['application/pdf'],
  };

  if (!allowedMimes[contentType].includes(mimeType)) {
    return c.json({ error: `Invalid file type for ${contentType}` }, 400);
  }

  // Get module
  const { data: module } = await c.env.SUPABASE
    .from('course_modules')
    .select('course_id')
    .eq('id', moduleId)
    .single();

  if (!module) return c.json({ error: 'Module not found' }, 404);

  // Generate R2 key
  const ext = file.name.split('.').pop();
  const r2Key = `courses/${module.course_id}/${moduleId}/${Date.now()}_${file.name}`;

  // Upload to R2
  try {
    const buffer = await file.arrayBuffer();
    await c.env.FILES.put(r2Key, buffer, {
      httpMetadata: { contentType: mimeType },
    });
  } catch (err) {
    return c.json({ error: 'R2 upload failed: ' + err.message }, 500);
  }

  // Store file metadata in DB
  const { data: fileRecord, error: fileError } = await c.env.SUPABASE
    .from('files')
    .insert([{
      owner_id: user.id,
      r2_key: r2Key,
      file_name: file.name,
      content_type: mimeType,
      size_bytes: file.size,
    }])
    .select()
    .single();

  if (fileError) return c.json({ error: fileError.message }, 400);

  // Add to course_module_content
  const contentUrl = `${c.env.R2_PUBLIC_URL}/${r2Key}`;
  const { data: content, error: contentError } = await c.env.SUPABASE
    .from('course_module_content')
    .insert([{
      module_id: moduleId,
      content_type: contentType,
      content_url: contentUrl,
      file_id: fileRecord.id,
    }])
    .select()
    .single();

  if (contentError) {
    // Clean up R2 if DB insert fails
    await c.env.FILES.delete(r2Key);
    return c.json({ error: contentError.message }, 400);
  }

  // For videos, create video_metadata record
  if (contentType === 'video') {
    await c.env.SUPABASE.from('video_metadata').insert([{
      file_id: fileRecord.id,
      transcoding_status: 'ready',
    }]);
  }

  return c.json({
    content,
    file: fileRecord,
    url: contentUrl,
  }, 201);
});

// POST /api/admin/courses/:courseId/materials - add course material (template, guide, etc.)
const AddMaterialSchema = z.object({
  material_type: z.enum(['template', 'guide', 'calculator', 'sample', 'syllabus', 'case_study']),
  title: z.string(),
  description: z.string().optional(),
  pricing_model: z.string().optional(),
  roi_info: z.record(z.any()).optional(),
  course_structure: z.record(z.any()).optional(),
  industry: z.enum(['hr', 'payroll', 'recruitment', 'compliance']).optional(),
});

router.post('/courses/:courseId/materials', zValidator('json', AddMaterialSchema), async (c) => {
  const { courseId } = c.req.param();
  const body = c.req.valid('json');

  const { data, error } = await c.env.SUPABASE
    .from('course_materials')
    .insert([{ course_id: courseId, ...body }])
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ material: data }, 201);
});

// POST /api/admin/courses/:courseId/publish - publish course (set status to active)
router.post('/courses/:courseId/publish', async (c) => {
  const { courseId } = c.req.param();

  const { data, error } = await c.env.SUPABASE
    .from('courses')
    .update({ status: 'active' })
    .eq('id', courseId)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ course: data });
});

// DELETE /api/admin/modules/:moduleId/content/:contentId - delete module content
router.delete('/modules/:moduleId/content/:contentId', async (c) => {
  const { contentId, moduleId } = c.req.param();

  // Get content to find file_id
  const { data: content } = await c.env.SUPABASE
    .from('course_module_content')
    .select('file_id')
    .eq('id', contentId)
    .eq('module_id', moduleId)
    .single();

  if (!content) return c.json({ error: 'Content not found' }, 404);

  // Delete from course_module_content
  const { error: deleteError } = await c.env.SUPABASE
    .from('course_module_content')
    .delete()
    .eq('id', contentId);

  if (deleteError) return c.json({ error: deleteError.message }, 400);

  // If file exists, delete from R2 and files table
  if (content.file_id) {
    const { data: file } = await c.env.SUPABASE
      .from('files')
      .select('r2_key')
      .eq('id', content.file_id)
      .single();

    if (file) {
      await c.env.FILES.delete(file.r2_key);
      await c.env.SUPABASE.from('files').delete().eq('id', content.file_id);
    }
  }

  return c.json({ success: true });
});

export default router;
