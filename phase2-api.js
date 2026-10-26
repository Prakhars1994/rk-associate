// RK ASSOCIATES PHASE 2 BACKEND API
// Cloudflare Workers + Supabase PostgreSQL
// Oct 26, 2026

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
const RAZORPAY_KEY_ID = 'your-razorpay-key-id';
const RAZORPAY_SECRET = 'your-razorpay-secret';

// ============================================
// AUTHENTICATION & JWT
// ============================================

async function registerUser(email, password, fullName, phone, role = 'student') {
  try {
    const passwordHash = await hashPassword(password);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone,
        role,
        status: 'active'
      })
    });

    if (response.ok) {
      const user = await response.json();
      const token = generateJWT(user.id, email, role);
      return { success: true, token, user };
    } else {
      return { success: false, error: 'Registration failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function loginUser(email, password) {
  try {
    const userResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=eq.${email}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const users = await userResponse.json();
    if (users.length === 0) return { success: false, error: 'User not found' };

    const user = users[0];
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) return { success: false, error: 'Invalid password' };

    const token = generateJWT(user.id, user.email, user.role);

    // Update last login
    await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ last_login: new Date().toISOString() })
      }
    );

    return { success: true, token, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function generateJWT(userId, email, role) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
  }));
  const signature = btoa(`${header}.${payload}`); // Simplified - use HMAC-SHA256 in production
  return `${header}.${payload}.${signature}`;
}

async function hashPassword(password) {
  // Use bcrypt or argon2 in production
  return btoa(password); // Placeholder - NEVER use this in production!
}

async function comparePassword(password, hash) {
  return btoa(password) === hash;
}

function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// ============================================
// CLIENT PORTAL - TICKETS
// ============================================

async function createTicket(clientId, category, subject, description, priority = 'medium') {
  try {
    const ticketNumber = `TK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        ticket_number: ticketNumber,
        client_id: clientId,
        category,
        subject,
        description,
        priority,
        status: 'open'
      })
    });

    if (response.ok) {
      const ticket = await response.json();
      return { success: true, ticket };
    } else {
      return { success: false, error: 'Failed to create ticket' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getTickets(clientId) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/tickets?client_id=eq.${clientId}&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const tickets = await response.json();
    return { success: true, tickets };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function addTicketComment(ticketId, userId, comment, isInternal = false) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ticket_comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        user_id: userId,
        comment,
        is_internal: isInternal
      })
    });

    if (response.ok) {
      return { success: true, comment: await response.json() };
    }
    return { success: false, error: 'Failed to add comment' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// FILE SHARING & UPLOADS
// ============================================

async function uploadFile(ticketId, userId, fileName, fileContent, fileType, visibility = 'private') {
  try {
    // Upload to Cloudflare R2 or S3
    const fileUrl = `https://files.rk-associate.workers.dev/${ticketId}/${fileName}`;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        user_id: userId,
        file_name: fileName,
        file_type: fileType,
        file_size_bytes: fileContent.length,
        file_url: fileUrl,
        visibility,
        scan_status: 'pending'
      })
    });

    if (response.ok) {
      return { success: true, file: await response.json(), fileUrl };
    }
    return { success: false, error: 'File upload failed' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getTicketFiles(ticketId) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/files?ticket_id=eq.${ticketId}&order=upload_date.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const files = await response.json();
    return { success: true, files };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// PAYMENTS - RAZORPAY
// ============================================

async function createRazorpayOrder(enrollmentId, userId, amount) {
  try {
    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `enroll_${enrollmentId}`
    };

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_SECRET}`);
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(orderData)
    });

    const order = await razorpayResponse.json();

    if (order.id) {
      const paymentRecord = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          user_id: userId,
          amount,
          razorpay_order_id: order.id,
          status: 'pending',
          payment_method: 'razorpay'
        })
      });

      return { success: true, order, paymentId: (await paymentRecord.json()).id };
    }
    return { success: false, error: 'Failed to create Razorpay order' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function verifyPayment(paymentId, razorpayPaymentId, razorpaySignature) {
  try {
    // Verify signature (implement HMAC-SHA256 verification)
    const signatureValid = true; // TODO: Implement proper verification

    if (signatureValid) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/payments?id=eq.${paymentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            status: 'completed',
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature
          })
        }
      );

      return { success: true, message: 'Payment verified' };
    }
    return { success: false, error: 'Signature verification failed' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// CERTIFICATES
// ============================================

async function generateCertificate(enrollmentId, userId, courseId) {
  try {
    const verificationCode = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        enrollment_id: enrollmentId,
        user_id: userId,
        course_id: courseId,
        certificate_url: `https://certs.rk-associate.workers.dev/${verificationCode}.pdf`,
        issued_date: new Date().toISOString(),
        verification_code: verificationCode,
        is_digital: true
      })
    });

    if (response.ok) {
      return { success: true, certificate: await response.json() };
    }
    return { success: false, error: 'Failed to generate certificate' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// MAIN WORKER HANDLER
// ============================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    };

    if (method === 'OPTIONS') {
      return new Response('OK', { headers: corsHeaders });
    }

    // Extract JWT token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = token ? verifyJWT(token) : null;

    // API Routes
    if (pathname === '/api/auth/register' && method === 'POST') {
      const { email, password, fullName, phone } = await request.json();
      const result = await registerUser(email, password, fullName, phone);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const { email, password } = await request.json();
      const result = await loginUser(email, password);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (pathname === '/api/tickets' && method === 'POST' && user) {
      const { category, subject, description, priority } = await request.json();
      const result = await createTicket(user.sub, category, subject, description, priority);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (pathname === '/api/tickets' && method === 'GET' && user) {
      const result = await getTickets(user.sub);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (pathname.startsWith('/api/tickets/') && pathname.endsWith('/comments') && method === 'POST' && user) {
      const ticketId = pathname.split('/')[3];
      const { comment, isInternal } = await request.json();
      const result = await addTicketComment(ticketId, user.sub, comment, isInternal);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (pathname === '/api/files/upload' && method === 'POST' && user) {
      const { ticketId, fileName, fileContent, fileType, visibility } = await request.json();
      const result = await uploadFile(ticketId, user.sub, fileName, fileContent, fileType, visibility);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (pathname.startsWith('/api/tickets/') && pathname.endsWith('/files') && method === 'GET') {
      const ticketId = pathname.split('/')[3];
      const result = await getTicketFiles(ticketId);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (pathname === '/api/payments/create' && method === 'POST' && user) {
      const { enrollmentId, amount } = await request.json();
      const result = await createRazorpayOrder(enrollmentId, user.sub, amount);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (pathname === '/api/payments/verify' && method === 'POST') {
      const { paymentId, razorpayPaymentId, razorpaySignature } = await request.json();
      const result = await verifyPayment(paymentId, razorpayPaymentId, razorpaySignature);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (pathname === '/api/certificates/generate' && method === 'POST' && user) {
      const { enrollmentId, courseId } = await request.json();
      const result = await generateCertificate(enrollmentId, user.sub, courseId);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Route not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
};
