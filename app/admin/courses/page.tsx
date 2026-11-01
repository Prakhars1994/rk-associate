'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCourseDashboard } from '@/components/AdminCourseDashboard';

export default function AdminCoursesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated and is admin
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (!response.ok) {
          router.push('/login');
          return;
        }

        const data = await response.json();

        // Verify admin role
        if (data.user?.role !== 'admin') {
          setError('Admin access required');
          setLoading(false);
          return;
        }

        setToken(localStorage.getItem('auth_token') || '');
        setLoading(false);
      } catch (err) {
        setError('Failed to verify authentication');
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Verifying access...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#c62828' }}>
        <h2>{error}</h2>
        <a href="/login" style={{ color: '#7a263a', textDecoration: 'underline' }}>
          Return to login
        </a>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return <AdminCourseDashboard token={token} />;
}
