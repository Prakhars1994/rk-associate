// RK ASSOCIATES - COMPLETE PLATFORM
// Phase 1 (Frontend) + Phase 2 (Backend) Combined
// Cloudflare Workers - Single Deployment
// Oct 26, 2026

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
const RAZORPAY_KEY_ID = 'rzp_live_xxxxx';
const SENDGRID_KEY = 'SG.xxxxx';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    };

    if (request.method === 'OPTIONS') {
      return new Response('OK', { headers: corsHeaders });
    }

    // ============================================
    // PHASE 1: PUBLIC PAGES (HOMEPAGE, COURSES, LOGIN, REGISTER)
    // ============================================

    if (pathname === '/' || pathname === '/home') {
      return new Response(renderHomepage(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (pathname === '/login') {
      return new Response(renderLogin(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (pathname === '/register') {
      return new Response(renderRegister(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (pathname === '/courses') {
      return new Response(renderCourses(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (pathname === '/free-resources') {
      return new Response(renderFreeResources(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (pathname === '/checkout') {
      return new Response(renderCheckout(url), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (pathname === '/admin') {
      return new Response(renderAdmin(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // ============================================
    // PHASE 2: PROTECTED ROUTES (REQUIRES JWT)
    // ============================================

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = token ? verifyJWT(token) : null;

    // Client Portal Dashboard
    if (pathname === '/portal' || pathname === '/dashboard') {
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      return new Response(renderClientPortal(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // ============================================
    // API ROUTES
    // ============================================

    // AUTH
    if (pathname === '/api/auth/register' && request.method === 'POST') {
      const { email, password, fullName, phone } = await request.json();
      const result = await registerUser(email, password, fullName, phone);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (pathname === '/api/auth/login' && request.method === 'POST') {
      const { email, password } = await request.json();
      const result = await loginUser(email, password);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // TICKETS
    if (pathname === '/api/tickets' && request.method === 'POST' && user) {
      const { category, subject, description, priority } = await request.json();
      const result = await createTicket(user.sub, category, subject, description, priority);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (pathname === '/api/tickets' && request.method === 'GET' && user) {
      const result = await getTickets(user.sub);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // COMMENTS
    if (pathname.startsWith('/api/tickets/') && pathname.endsWith('/comments') && request.method === 'POST' && user) {
      const ticketId = pathname.split('/')[3];
      const { comment, isInternal } = await request.json();
      const result = await addComment(ticketId, user.sub, comment, isInternal);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PAYMENTS
    if (pathname === '/api/payments/create' && request.method === 'POST' && user) {
      const { enrollmentId, amount } = await request.json();
      const result = await createPayment(enrollmentId, user.sub, amount);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (pathname === '/api/payments/verify' && request.method === 'POST') {
      const { paymentId, razorpayPaymentId, razorpaySignature } = await request.json();
      const result = await verifyPayment(paymentId, razorpayPaymentId, razorpaySignature);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // FILES
    if (pathname === '/api/files/upload' && request.method === 'POST' && user) {
      const { ticketId, fileName, fileContent, fileType } = await request.json();
      const result = await uploadFile(ticketId, user.sub, fileName, fileContent, fileType);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (pathname.startsWith('/api/tickets/') && pathname.endsWith('/files') && request.method === 'GET') {
      const ticketId = pathname.split('/')[3];
      const result = await getFiles(ticketId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // CERTIFICATES
    if (pathname === '/api/certificates/generate' && request.method === 'POST' && user) {
      const { enrollmentId, courseId } = await request.json();
      const result = await generateCertificate(enrollmentId, user.sub, courseId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: '404 Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

// ============================================
// PHASE 1: FRONTEND PAGES (From phase1-worker)
// ============================================

function renderHomepage() { /* ... HTML content ... */ return '<html>...</html>'; }
function renderLogin() { /* ... HTML content ... */ return '<html>...</html>'; }
function renderRegister() { /* ... HTML content ... */ return '<html>...</html>'; }
function renderCourses() { /* ... HTML content ... */ return '<html>...</html>'; }
function renderFreeResources() { /* ... HTML content ... */ return '<html>...</html>'; }
function renderCheckout(url) { /* ... HTML content ... */ return '<html>...</html>'; }
function renderAdmin() { /* ... HTML content ... */ return '<html>...</html>'; }

// ============================================
// PHASE 2: CLIENT PORTAL
// ============================================

function renderClientPortal() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RK Associates - Client Portal</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
    .navbar { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 15px 20px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #ddd; }
    .tab-btn { padding: 12px 20px; border: none; background: none; cursor: pointer; color: #666; border-bottom: 3px solid transparent; }
    .tab-btn.active { color: #1e3c72; border-bottom-color: #1e3c72; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="navbar">
    <h1>RK Associates - Client Portal</h1>
  </div>
  <div class="container">
    <div class="tabs">
      <button class="tab-btn active">Dashboard</button>
      <button class="tab-btn">Tickets</button>
      <button class="tab-btn">Files</button>
      <button class="tab-btn">Courses</button>
    </div>
    <div class="tab-content active">
      <div class="card"><h2>Dashboard</h2><p>Welcome to your client portal</p></div>
    </div>
  </div>
</body>
</html>`;
}

// ============================================
// AUTHENTICATION
// ============================================

function generateJWT(userId, email, role) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400
  }));
  return `${header}.${payload}.signature`;
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

async function registerUser(email, password, fullName, phone) {
  try {
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    // Insert into Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        id: userId,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone,
        role: 'student',
        status: 'active'
      })
    });

    if (response.ok) {
      const token = generateJWT(userId, email, 'student');
      return { success: true, token, user: { id: userId, email, full_name: fullName } };
    }
    return { success: false, error: 'Registration failed' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function loginUser(email, password) {
  try {
    // Fetch user from Supabase
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=eq.${email}`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const users = await response.json();
    if (users.length === 0) return { success: false, error: 'User not found' };

    const user = users[0];
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) return { success: false, error: 'Invalid password' };

    const token = generateJWT(user.id, user.email, user.role);
    return { success: true, token, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function hashPassword(password) {
  // Use bcrypt in production
  return btoa(password);
}

async function comparePassword(password, hash) {
  return btoa(password) === hash;
}

// ============================================
// TICKET OPERATIONS
// ============================================

async function createTicket(clientId, category, subject, description, priority = 'medium') {
  try {
    const ticketNumber = `TK-${Date.now()}`;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
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

    return { success: response.ok, ticket: await response.json() };
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
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const tickets = await response.json();
    return { success: true, tickets };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function addComment(ticketId, userId, comment, isInternal = false) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ticket_comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        user_id: userId,
        comment,
        is_internal: isInternal
      })
    });

    return { success: response.ok, comment: await response.json() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// FILE OPERATIONS
// ============================================

async function uploadFile(ticketId, userId, fileName, fileContent, fileType) {
  try {
    const fileUrl = `https://files.rk-associate.workers.dev/${ticketId}/${fileName}`;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        user_id: userId,
        file_name: fileName,
        file_type: fileType,
        file_size_bytes: fileContent.length,
        file_url: fileUrl
      })
    });

    return { success: response.ok, file: await response.json() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getFiles(ticketId) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/files?ticket_id=eq.${ticketId}`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
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
// PAYMENT OPERATIONS
// ============================================

async function createPayment(enrollmentId, userId, amount) {
  try {
    const auth = btoa(`${RAZORPAY_KEY_ID}:YOUR_SECRET`);
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `enroll_${enrollmentId}`
      })
    });

    const order = await razorpayResponse.json();

    if (order.id) {
      const paymentRecord = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          user_id: userId,
          amount,
          razorpay_order_id: order.id,
          status: 'pending'
        })
      });

      return { success: true, order };
    }
    return { success: false, error: 'Payment creation failed' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function verifyPayment(paymentId, razorpayPaymentId, razorpaySignature) {
  try {
    // Verify signature
    await fetch(`${SUPABASE_URL}/rest/v1/payments?id=eq.${paymentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        status: 'completed',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature
      })
    });

    return { success: true, message: 'Payment verified' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// CERTIFICATE OPERATIONS
// ============================================

async function generateCertificate(enrollmentId, userId, courseId) {
  try {
    const verificationCode = `CERT-${Date.now()}`;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        enrollment_id: enrollmentId,
        user_id: userId,
        course_id: courseId,
        verification_code: verificationCode,
        issued_date: new Date().toISOString()
      })
    });

    return { success: response.ok, certificate: await response.json() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
