'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadProgress {
  courseId?: string;
  moduleId?: string;
  fileName: string;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface Course {
  id: string;
  slug: string;
  title: string;
  description?: string;
  price_paise: number;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
}

interface Module {
  id: string;
  position: number;
  title: string;
}

export function AdminCourseDashboard({ token }: { token: string }) {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    price_paise: 0,
    duration_days: 0,
  });

  const [moduleForm, setModuleForm] = useState({
    position: 1,
    title: '',
  });

  const [youtubeForm, setYoutubeForm] = useState({
    youtube_url: '',
    video_title: '',
  });

  const apiBase = typeof window !== 'undefined' ? window.location.origin : '';

  // Load courses
  const loadCourses = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/admin/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  }, [token, apiBase]);

  // Load course details
  const loadCourseDetails = useCallback(async (courseId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setModules(data.modules || []);
    } catch (err) {
      console.error('Failed to load course details:', err);
    }
  }, [token, apiBase]);

  // Create course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBase}/api/admin/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slug: formData.slug,
          title: formData.title,
          description: formData.description,
          price_paise: formData.price_paise * 100, // Convert rupees to paise
          duration_days: formData.duration_days || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to create course');
      const data = await res.json();
      setCourses([data.course, ...courses]);
      setFormData({ slug: '', title: '', description: '', price_paise: 0, duration_days: 0 });
      setMode('list');
      alert('Course created! Now add modules and content.');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Add module
  const handleAddModule = async (courseId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(moduleForm),
      });

      if (!res.ok) throw new Error('Failed to add module');
      await loadCourseDetails(courseId);
      setModuleForm({ position: (moduleForm.position || 0) + 1, title: '' });
      alert('Module added!');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // File upload
  const onDrop = useCallback(
    async (acceptedFiles: File[], moduleId: string) => {
      for (const file of acceptedFiles) {
        const uploadId = `${moduleId}-${file.name}`;
        setUploads((prev) => [...prev, { fileName: file.name, progress: 0, status: 'idle' }]);

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('content_type', file.type.startsWith('video') ? 'video' : 'pdf');

          setUploads((prev) =>
            prev.map((u) => (u.fileName === file.name ? { ...u, status: 'uploading', progress: 30 } : u))
          );

          const res = await fetch(`${apiBase}/api/admin/modules/${moduleId}/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Upload failed');
          }

          setUploads((prev) =>
            prev.map((u) =>
              u.fileName === file.name ? { ...u, status: 'success', progress: 100 } : u
            )
          );

          if (selectedCourse) {
            await loadCourseDetails(selectedCourse.id);
          }
        } catch (err) {
          setUploads((prev) =>
            prev.map((u) =>
              u.fileName === file.name
                ? { ...u, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' }
                : u
            )
          );
        }
      }
    },
    [token, apiBase, selectedCourse, loadCourseDetails]
  );

  // Add YouTube link
  const handleAddYouTube = async (moduleId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/admin/modules/${moduleId}/youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(youtubeForm),
      });

      if (!res.ok) throw new Error('Failed to add YouTube link');
      if (selectedCourse) {
        await loadCourseDetails(selectedCourse.id);
      }
      setYoutubeForm({ youtube_url: '', video_title: '' });
      alert('YouTube link added!');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Publish course
  const handlePublishCourse = async (courseId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/admin/courses/${courseId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to publish course');
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: 'active' } : c))
      );
      alert('Course published!');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="formPanel" style={{ maxWidth: '1000px', margin: '40px auto' }}>
      <h1 style={{ color: '#3d101a', fontFamily: 'Georgia, serif', fontSize: '2.5rem', marginTop: 0 }}>
        Admin Dashboard
      </h1>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #d7b46a', paddingBottom: '12px' }}>
        <button className="btn" onClick={() => { setMode('list'); loadCourses(); }} style={{ background: mode === 'list' ? '#7a263a' : '#ccc' }}>
          Courses
        </button>
        <button className="btn" onClick={() => setMode('create')} style={{ background: mode === 'create' ? '#7a263a' : '#ccc' }}>
          Create Course
        </button>
      </div>

      {/* Create Course Mode */}
      {mode === 'create' && (
        <form onSubmit={handleCreateCourse} className="form" style={{ background: '#fffaf2', padding: '24px', borderRadius: '8px' }}>
          <h2 style={{ color: '#7a263a', marginTop: 0 }}>Create New Course</h2>

          <input
            type="text"
            placeholder="Course slug (e.g., advanced-hr)"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            pattern="[a-z0-9_-]+"
            required
          />

          <input
            type="text"
            placeholder="Course title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ minHeight: '100px' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              type="number"
              placeholder="Price (₹)"
              value={formData.price_paise}
              onChange={(e) => setFormData({ ...formData, price_paise: parseFloat(e.target.value) || 0 })}
              step="0.01"
              min="0"
            />

            <input
              type="number"
              placeholder="Duration (days)"
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>

          <button type="submit" className="btn" style={{ width: '100%', marginTop: '12px' }}>
            Create Course
          </button>
        </form>
      )}

      {/* Courses List */}
      {mode === 'list' && (
        <div>
          <button onClick={loadCourses} className="btn" style={{ marginBottom: '16px' }}>
            Refresh
          </button>

          {courses.length === 0 ? (
            <p style={{ color: '#60716c' }}>No courses yet. Create one to get started.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {courses.map((course) => (
                <div
                  key={course.id}
                  style={{
                    border: '2px solid #d7b46a',
                    borderRadius: '8px',
                    padding: '16px',
                    background: '#fffaf2',
                  }}
                >
                  <h3 style={{ color: '#7a263a', marginTop: 0 }}>{course.title}</h3>
                  <p style={{ color: '#60716c', fontSize: '14px', margin: '8px 0' }}>
                    <strong>Slug:</strong> {course.slug}
                  </p>
                  <p style={{ color: '#60716c', fontSize: '14px', margin: '8px 0' }}>
                    <strong>Price:</strong> ₹{(course.price_paise / 100).toFixed(2)}
                  </p>
                  <p style={{ color: '#60716c', fontSize: '14px', margin: '8px 0' }}>
                    <strong>Status:</strong> <span style={{ color: course.status === 'active' ? '#2e7d32' : '#f57c00' }}>{course.status}</span>
                  </p>

                  <button
                    onClick={() => {
                      setSelectedCourse(course);
                      setMode('edit');
                      loadCourseDetails(course.id);
                    }}
                    className="btn"
                    style={{ width: '100%', marginTop: '12px' }}
                  >
                    Manage Content
                  </button>

                  {course.status === 'draft' && (
                    <button
                      onClick={() => handlePublishCourse(course.id)}
                      className="btn"
                      style={{ width: '100%', marginTop: '8px', background: '#2e7d32' }}
                    >
                      Publish
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Course Mode */}
      {mode === 'edit' && selectedCourse && (
        <div>
          <button onClick={() => setMode('list')} className="btn" style={{ marginBottom: '16px' }}>
            ← Back to Courses
          </button>

          <h2 style={{ color: '#7a263a' }}>Manage: {selectedCourse.title}</h2>

          {/* Add Module Section */}
          <div style={{ background: '#fffaf2', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <h3 style={{ color: '#7a263a', marginTop: 0 }}>Add Module</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '12px' }}>
              <input
                type="number"
                placeholder="Position"
                value={moduleForm.position}
                onChange={(e) => setModuleForm({ ...moduleForm, position: parseInt(e.target.value) || 1 })}
                min="1"
              />
              <input
                type="text"
                placeholder="Module title (e.g., Introduction to HR)"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
              />
              <button onClick={() => handleAddModule(selectedCourse.id)} className="btn">
                Add
              </button>
            </div>
          </div>

          {/* Modules & Content */}
          {modules.length === 0 ? (
            <p style={{ color: '#60716c' }}>No modules yet. Add one above to start adding content.</p>
          ) : (
            modules.map((module) => (
              <ModuleEditor
                key={module.id}
                module={module}
                token={token}
                apiBase={apiBase}
                onYouTubeAdd={() => handleAddYouTube(module.id)}
                youtubeForm={youtubeForm}
                setYoutubeForm={setYoutubeForm}
                onDrop={(files) => onDrop(files, module.id)}
                uploads={uploads.filter((u) => u.fileName)}
              />
            ))
          )}
        </div>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div style={{ marginTop: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3 style={{ color: '#3d101a', marginTop: 0 }}>Uploads</h3>
          {uploads.map((upload, idx) => (
            <div key={idx} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#60716c', fontSize: '14px' }}>{upload.fileName}</span>
                <span
                  style={{
                    color: upload.status === 'success' ? '#2e7d32' : upload.status === 'error' ? '#c62828' : '#666',
                    fontSize: '12px',
                  }}
                >
                  {upload.status === 'uploading' ? `${upload.progress}%` : upload.status}
                </span>
              </div>
              <div style={{ background: '#e0e0e0', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    background: upload.status === 'error' ? '#c62828' : '#2e7d32',
                    height: '100%',
                    width: `${upload.progress}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              {upload.error && <p style={{ color: '#c62828', fontSize: '12px', margin: '4px 0 0 0' }}>{upload.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleEditor({
  module,
  token,
  apiBase,
  onYouTubeAdd,
  youtubeForm,
  setYoutubeForm,
  onDrop,
  uploads,
}: {
  module: Module;
  token: string;
  apiBase: string;
  onYouTubeAdd: () => void;
  youtubeForm: { youtube_url: string; video_title: string };
  setYoutubeForm: (form: { youtube_url: string; video_title: string }) => void;
  onDrop: (files: File[]) => void;
  uploads: any[];
}) {
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div style={{ background: '#fffaf2', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '2px solid #d7b46a' }}>
      <h3 style={{ color: '#7a263a', marginTop: 0 }}>
        Module {module.position}: {module.title}
      </h3>

      {/* File Upload */}
      <div
        {...getRootProps()}
        style={{
          border: '2px dashed #d7b46a',
          padding: '24px',
          textAlign: 'center',
          borderRadius: '8px',
          cursor: 'pointer',
          background: '#fff',
          marginBottom: '16px',
        }}
      >
        <input {...getInputProps()} accept="video/*,.pdf" />
        <p style={{ color: '#60716c', margin: 0 }}>
          💾 Drag & drop video (MP4, WebM) or PDF files here, or click to select
        </p>
      </div>

      {/* YouTube Link */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 80px', gap: '12px', marginBottom: '16px' }}>
        <input
          type="url"
          placeholder="YouTube URL (https://youtube.com/watch?v=...)"
          value={youtubeForm.youtube_url}
          onChange={(e) => setYoutubeForm({ ...youtubeForm, youtube_url: e.target.value })}
        />
        <input
          type="text"
          placeholder="Video title (optional)"
          value={youtubeForm.video_title}
          onChange={(e) => setYoutubeForm({ ...youtubeForm, video_title: e.target.value })}
        />
        <button onClick={onYouTubeAdd} className="btn">
          Add Link
        </button>
      </div>
    </div>
  );
}
