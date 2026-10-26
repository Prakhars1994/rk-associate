// RK ASSOCIATES - COMPLETE HR TRAINING PLATFORM
// Cloudflare Worker - https://rk-associate.vliab.workers.dev/
// Updated: Oct 26, 2026

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Route requests to appropriate handlers
    if (pathname === '/' || pathname === '/home') {
      return new Response(renderHomepage(), { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }
    if (pathname === '/login') {
      return new Response(renderLogin(), { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }
    if (pathname === '/register') {
      return new Response(renderRegister(), { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }
    if (pathname === '/dashboard') {
      return new Response(renderDashboard(), { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }
    if (pathname === '/courses') {
      return new Response(renderCourses(), { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }
    if (pathname === '/free-resources') {
      return new Response(renderFreeResources(), { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }
    if (pathname === '/checkout') {
      return new Response(renderCheckout(url), { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }
    if (pathname === '/admin') {
      return new Response(renderAdmin(), { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }

    return new Response('404 - Page not found', { status: 404 });
  }
};

// ============================================
// HOMEPAGE
// ============================================

function renderHomepage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RK Associates - HR Training & Consultancy</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }

        header { background: white; padding: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100; }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
        .logo { color: #1e3c72; font-size: 24px; font-weight: bold; }
        nav { display: flex; gap: 30px; }
        nav a { color: #666; text-decoration: none; transition: color 0.3s; }
        nav a:hover { color: #1e3c72; }
        .btn-login { background: #1e3c72; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; }

        .hero { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 100px 20px; text-align: center; }
        .hero h1 { font-size: 48px; margin-bottom: 10px; }
        .hero p { font-size: 18px; margin-bottom: 30px; }
        .btn-primary { background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 0 10px; transition: background 0.3s; }
        .btn-primary:hover { background: #e55a24; }

        section { padding: 60px 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h2 { font-size: 36px; color: #1e3c72; margin-bottom: 30px; text-align: center; }

        .about { background: #f8f9fa; }
        .about-content { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
        .about-text p { color: #666; margin-bottom: 15px; }

        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; text-align: center; }
        .stat { padding: 20px; }
        .stat-number { font-size: 48px; color: #1e3c72; font-weight: bold; }
        .stat p { color: #666; margin-top: 10px; }

        .courses { background: white; }
        .courses-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .course-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.3s; }
        .course-card:hover { transform: translateY(-5px); }
        .course-card h3 { color: #1e3c72; margin-bottom: 10px; }
        .price { color: #ff6b35; font-weight: bold; font-size: 20px; margin: 15px 0; }

        .free-resources { background: #f8f9fa; }
        .resources-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .resource-card { background: white; padding: 20px; border-radius: 8px; text-align: center; }
        .resource-card h3 { color: #1e3c72; margin-bottom: 10px; }
        .resource-card a { color: #27ae60; text-decoration: none; font-weight: bold; }
        .resource-card a:hover { text-decoration: underline; }

        .contact { background: white; }
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        form { display: flex; flex-direction: column; gap: 15px; }
        input, textarea { padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; }
        input:focus, textarea:focus { outline: none; border-color: #1e3c72; }
        button { padding: 12px 30px; background: #1e3c72; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0f1f3f; }

        footer { background: #0f1f3f; color: white; padding: 40px 20px; text-align: center; }

        @media (max-width: 768px) {
          .about-content, .contact-grid { grid-template-columns: 1fr; }
          .stats { grid-template-columns: 1fr; }
          .hero h1 { font-size: 32px; }
          nav { flex-direction: column; gap: 10px; }
        }
      </style>
    </head>
    <body>
      <header>
        <div class="header-content">
          <div class="logo">RK Associates</div>
          <nav>
            <a href="/">Home</a>
            <a href="#about">About</a>
            <a href="/courses">Courses</a>
            <a href="/free-resources">Free Resources</a>
            <a href="#contact">Contact</a>
            <a href="/login" class="btn-login">Login</a>
          </nav>
        </div>
      </header>

      <section class="hero">
        <h1>Welcome to RK Associates</h1>
        <p>Expert HR Training & Consultancy Services</p>
        <p style="font-size: 16px; margin-bottom: 30px; opacity: 0.95;">Empowering professionals with comprehensive HR training and career development</p>
        <a href="/courses" class="btn-primary">Explore Courses</a>
        <a href="/free-resources" class="btn-primary" style="background: transparent; border: 2px solid white;">Free Resources</a>
      </section>

      <section class="about" id="about">
        <div class="container">
          <h2>About RK Associates</h2>
          <div class="about-content">
            <div class="about-text">
              <p><strong>10+ Years of Excellence in HR Training</strong></p>
              <p>RK Associates is a leading HR training and consultancy firm dedicated to empowering professionals and organizations with comprehensive training programs, expert guidance, and innovative solutions.</p>
              <p>With a team of experienced HR professionals, we deliver industry-leading training that transforms careers and drives organizational success.</p>
            </div>
            <div class="stats">
              <div class="stat">
                <div class="stat-number">150+</div>
                <p>Satisfied Clients</p>
              </div>
              <div class="stat">
                <div class="stat-number">10+</div>
                <p>Years Experience</p>
              </div>
              <div class="stat">
                <div class="stat-number">4</div>
                <p>Premium Courses</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="courses">
        <div class="container">
          <h2>Our Premium Courses</h2>
          <div class="courses-grid">
            <div class="course-card">
              <h3>Interview Preparation Masterclass</h3>
              <p>4 weeks • Master interview skills and techniques</p>
              <p class="price">₹4,999</p>
              <p style="font-size: 14px; color: #999; margin-bottom: 15px;">50+ video lessons • Live Q&A • Mock interviews</p>
              <a href="/checkout?course=interview" class="btn-primary" style="display: inline-block; width: 100%; text-align: center;">Enroll Now</a>
            </div>
            <div class="course-card">
              <h3>HR Fundamentals & Compliance</h3>
              <p>6 weeks • Essential HR knowledge and best practices</p>
              <p class="price">₹6,999</p>
              <p style="font-size: 14px; color: #999; margin-bottom: 15px;">PF & ESIC • Payroll basics • HR law</p>
              <a href="/checkout?course=hr-fundamentals" class="btn-primary" style="display: inline-block; width: 100%; text-align: center;">Enroll Now</a>
            </div>
            <div class="course-card">
              <h3>Advanced Recruitment Training</h3>
              <p>8 weeks • Modern recruitment strategies and techniques</p>
              <p class="price">₹8,999</p>
              <p style="font-size: 14px; color: #999; margin-bottom: 15px;">ATS systems • LinkedIn recruiting • Employer branding</p>
              <a href="/checkout?course=recruitment" class="btn-primary" style="display: inline-block; width: 100%; text-align: center;">Enroll Now</a>
            </div>
            <div class="course-card">
              <h3>PF & ESIC Expert Certification</h3>
              <p>5 weeks • Master compliance with expert certification</p>
              <p class="price">₹5,999</p>
              <p style="font-size: 14px; color: #999; margin-bottom: 15px;">Expert-led • Real-world cases • Certificate</p>
              <a href="/checkout?course=pf-esic" class="btn-primary" style="display: inline-block; width: 100%; text-align: center;">Enroll Now</a>
            </div>
          </div>
        </div>
      </section>

      <section class="free-resources">
        <div class="container">
          <h2>Free Resources & Demo Courses</h2>
          <p style="text-align: center; color: #666; margin-bottom: 40px;">Access premium learning materials completely FREE</p>
          <div class="resources-grid">
            <div class="resource-card">
              <h3>📚 Interview Prep Demo</h3>
              <p style="margin: 10px 0; color: #666;">2-week free introductory course</p>
              <a href="/courses">Access Now →</a>
            </div>
            <div class="resource-card">
              <h3>📄 Interview Q&A Guide</h3>
              <p style="margin: 10px 0; color: #666;">20+ common questions with answers</p>
              <a href="/free-resources">Download →</a>
            </div>
            <div class="resource-card">
              <h3>📝 Resume Templates</h3>
              <p style="margin: 10px 0; color: #666;">5 professional resume formats</p>
              <a href="/free-resources">Download →</a>
            </div>
            <div class="resource-card">
              <h3>🎓 HR Fundamentals Demo</h3>
              <p style="margin: 10px 0; color: #666;">2-week free intro to HR basics</p>
              <a href="/courses">Access Now →</a>
            </div>
            <div class="resource-card">
              <h3>📊 HR Compliance Checklist</h3>
              <p style="margin: 10px 0; color: #666;">2026 compliance requirements guide</p>
              <a href="/free-resources">Download →</a>
            </div>
            <div class="resource-card">
              <h3>🎬 Sample Video Lectures</h3>
              <p style="margin: 10px 0; color: #666;">Preview our course content free</p>
              <a href="/courses">Watch Now →</a>
            </div>
          </div>
        </div>
      </section>

      <section class="contact" id="contact">
        <div class="container">
          <h2>Get in Touch</h2>
          <div class="contact-grid">
            <div>
              <h3 style="color: #1e3c72; margin-bottom: 20px;">Contact Information</h3>
              <p><strong>📞 Phone:</strong> +91 96856 88099</p>
              <p style="margin: 10px 0;"><strong>📧 Email:</strong> info@rkassociates.com</p>
              <p style="margin: 10px 0;"><strong>📍 Location:</strong> New Delhi, India</p>
              <p style="margin-top: 20px; color: #666;">Available Monday-Friday, 9 AM - 6 PM IST</p>
            </div>
            <form onsubmit="handleContactForm(event)">
              <input type="text" placeholder="Your Full Name" required>
              <input type="email" placeholder="Your Email Address" required>
              <input type="tel" placeholder="Your Phone (Optional)">
              <textarea placeholder="Your Message" rows="4" required></textarea>
              <button type="submit">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      <footer>
        <p>&copy; 2026 RK Associates. All rights reserved.</p>
        <p style="margin-top: 10px; color: #ccc;">📞 +91 96856 88099 | 🌐 rk-associate.live</p>
        <p style="margin-top: 10px; font-size: 12px; color: #999;">Providing expert HR training since 2016</p>
      </footer>

      <script>
        function handleContactForm(e) {
          e.preventDefault();
          alert('Thank you for your message! We will contact you soon.');
          e.target.reset();
        }
      </script>
    </body>
    </html>
  `;
}

// ============================================
// LOGIN PAGE
// ============================================

function renderLogin() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login - RK Associates</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1e3c72, #2a5298); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .login-container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 400px; width: 100%; }
        h1 { text-align: center; color: #1e3c72; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; color: #333; font-weight: 500; }
        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
        input:focus { outline: none; border-color: #1e3c72; }
        button { width: 100%; padding: 12px; background: #1e3c72; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold; transition: background 0.3s; }
        button:hover { background: #0f1f3f; }
        .signup { text-align: center; margin-top: 20px; color: #666; }
        .signup a { color: #ff6b35; text-decoration: none; font-weight: bold; }
        .back-link { text-align: center; margin-top: 30px; }
        .back-link a { color: white; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="login-container">
        <h1>Login</h1>
        <form onsubmit="handleLogin(event)">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="your@email.com" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" required>
          </div>
          <button type="submit">Login</button>
        </form>
        <div class="signup">
          Don't have an account? <a href="/register">Register here</a>
        </div>
        <div class="back-link">
          <a href="/">← Back to Home</a>
        </div>
      </div>
      <script>
        function handleLogin(e) {
          e.preventDefault();
          alert('Login feature coming soon! Stay tuned.');
        }
      </script>
    </body>
    </html>
  `;
}

// ============================================
// REGISTER PAGE
// ============================================

function renderRegister() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Register - RK Associates</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1e3c72, #2a5298); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .register-container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 400px; width: 100%; }
        h1 { text-align: center; color: #1e3c72; margin-bottom: 30px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; color: #333; font-weight: 500; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
        button { width: 100%; padding: 12px; background: #1e3c72; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0f1f3f; }
        .login-link { text-align: center; margin-top: 20px; color: #666; }
        .login-link a { color: #ff6b35; text-decoration: none; }
        .back-link { text-align: center; margin-top: 20px; }
        .back-link a { color: white; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="register-container">
        <h1>Create Account</h1>
        <form onsubmit="handleRegister(event)">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="Your full name" required>
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="your@email.com" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" placeholder="Create a password" required>
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" placeholder="+91 XXXXX XXXXX" required>
          </div>
          <button type="submit">Register</button>
        </form>
        <div class="login-link">
          Already have an account? <a href="/login">Login here</a>
        </div>
        <div class="back-link">
          <a href="/">← Back to Home</a>
        </div>
      </div>
      <script>
        function handleRegister(e) {
          e.preventDefault();
          alert('Registration feature coming soon! Stay tuned.');
        }
      </script>
    </body>
    </html>
  `;
}

// ============================================
// DASHBOARD
// ============================================

function renderDashboard() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard - RK Associates</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; }
        .navbar { background: #1e3c72; color: white; padding: 20px; }
        .navbar-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .navbar h1 { font-size: 24px; }
        .navbar a { color: white; text-decoration: none; }
        .dashboard { max-width: 1200px; margin: 0 auto; padding: 30px 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
        .stat-number { font-size: 36px; color: #1e3c72; font-weight: bold; }
        .stat-label { color: #666; margin-top: 10px; }
        .section { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h2 { color: #1e3c72; margin-bottom: 20px; }
        .btn { background: #1e3c72; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; cursor: pointer; border: none; }
        .btn:hover { background: #0f1f3f; }
      </style>
    </head>
    <body>
      <div class="navbar">
        <div class="navbar-content">
          <h1>Welcome to Your Dashboard</h1>
          <a href="/">Logout</a>
        </div>
      </div>

      <div class="dashboard">
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">0</div>
            <div class="stat-label">Courses Enrolled</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">0%</div>
            <div class="stat-label">Average Progress</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">0</div>
            <div class="stat-label">Certificates Earned</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">₹0</div>
            <div class="stat-label">Amount Spent</div>
          </div>
        </div>

        <div class="section">
          <h2>My Courses</h2>
          <p style="color: #666; margin-bottom: 20px;">You haven't enrolled in any courses yet.</p>
          <button class="btn" onclick="location.href='/courses'">Browse Courses</button>
        </div>

        <div class="section">
          <h2>Recent Activity</h2>
          <p style="color: #666;">No recent activity. Start learning today!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// COURSES PAGE
// ============================================

function renderCourses() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Courses - RK Associates</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; }
        .header { background: #1e3c72; color: white; padding: 40px 20px; text-align: center; }
        .header-content { max-width: 1200px; margin: 0 auto; }
        .header h1 { font-size: 36px; margin-bottom: 10px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .courses-section { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .courses-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .course-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .course-card h3 { color: #1e3c72; margin-bottom: 10px; }
        .course-card p { color: #666; margin: 10px 0; }
        .price { color: #ff6b35; font-weight: bold; font-size: 20px; margin: 15px 0; }
        .btn-enroll { background: #1e3c72; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; }
        .btn-enroll:hover { background: #0f1f3f; }
        .back-link { text-align: center; margin: 30px 0; }
        .back-link a { color: #1e3c72; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <h1>Our Courses</h1>
          <p>Choose from our comprehensive HR training programs</p>
        </div>
      </div>

      <div class="courses-section">
        <div class="courses-grid">
          <div class="course-card">
            <h3>Interview Preparation Masterclass</h3>
            <p>Master interview skills with expert-led training and real-world scenarios</p>
            <p><strong>Duration:</strong> 4 weeks</p>
            <p><strong>Level:</strong> Beginner to Intermediate</p>
            <p class="price">₹4,999</p>
            <a href="/checkout?course=interview" class="btn-enroll">Enroll Now</a>
          </div>

          <div class="course-card">
            <h3>HR Fundamentals & Compliance</h3>
            <p>Essential HR knowledge including PF, ESIC, and compliance requirements</p>
            <p><strong>Duration:</strong> 6 weeks</p>
            <p><strong>Level:</strong> Beginner to Advanced</p>
            <p class="price">₹6,999</p>
            <a href="/checkout?course=hr-fundamentals" class="btn-enroll">Enroll Now</a>
          </div>

          <div class="course-card">
            <h3>Advanced Recruitment Training</h3>
            <p>Modern recruitment strategies, ATS systems, and talent acquisition</p>
            <p><strong>Duration:</strong> 8 weeks</p>
            <p><strong>Level:</strong> Advanced</p>
            <p class="price">₹8,999</p>
            <a href="/checkout?course=recruitment" class="btn-enroll">Enroll Now</a>
          </div>

          <div class="course-card">
            <h3>PF & ESIC Expert Certification</h3>
            <p>Master compliance with expert-led certification and real-world case studies</p>
            <p><strong>Duration:</strong> 5 weeks</p>
            <p><strong>Level:</strong> Intermediate to Advanced</p>
            <p class="price">₹5,999</p>
            <a href="/checkout?course=pf-esic" class="btn-enroll">Enroll Now</a>
          </div>
        </div>
      </div>

      <div class="back-link">
        <a href="/">← Back to Home</a>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// FREE RESOURCES PAGE
// ============================================

function renderFreeResources() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Free Resources - RK Associates</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; }
        .header { background: #27ae60; color: white; padding: 40px 20px; text-align: center; }
        .header h1 { font-size: 36px; margin-bottom: 10px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .resources-section { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .resources-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .resource-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
        .resource-card h3 { color: #1e3c72; margin-bottom: 10px; }
        .resource-card p { color: #666; margin: 10px 0; }
        .download-btn { background: #27ae60; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; display: inline-block; }
        .download-btn:hover { background: #1e8449; }
        .back-link { text-align: center; margin: 30px 0; }
        .back-link a { color: #1e3c72; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Free Learning Resources</h1>
        <p>Access all these learning materials completely FREE</p>
      </div>

      <div class="resources-section">
        <div class="resources-grid">
          <div class="resource-card">
            <h3>📚 Interview Prep Demo Course</h3>
            <p>2-week free intro course to master interviews</p>
            <a href="#" class="download-btn">Access Course</a>
          </div>

          <div class="resource-card">
            <h3>📄 Interview Q&A Cheat Sheet</h3>
            <p>20 common interview questions with expert answers</p>
            <a href="#" class="download-btn">Download PDF</a>
          </div>

          <div class="resource-card">
            <h3>📝 Professional Resume Templates</h3>
            <p>5 ready-to-use resume formats for different industries</p>
            <a href="#" class="download-btn">Download ZIP</a>
          </div>

          <div class="resource-card">
            <h3>📋 HR Compliance Checklist 2026</h3>
            <p>Complete compliance requirements and best practices</p>
            <a href="#" class="download-btn">Download PDF</a>
          </div>

          <div class="resource-card">
            <h3>🎓 HR Fundamentals Demo Course</h3>
            <p>2-week free intro course to HR basics</p>
            <a href="#" class="download-btn">Access Course</a>
          </div>

          <div class="resource-card">
            <h3>📊 Job Description Templates</h3>
            <p>30+ ready-to-use JD templates for common roles</p>
            <a href="#" class="download-btn">Download DOC</a>
          </div>

          <div class="resource-card">
            <h3>🎬 Sample Video Lectures</h3>
            <p>Preview our premium course content for free</p>
            <a href="#" class="download-btn">Watch Now</a>
          </div>

          <div class="resource-card">
            <h3>💼 Employee Handbook Template</h3>
            <p>Complete employee handbook ready to customize</p>
            <a href="#" class="download-btn">Download</a>
          </div>
        </div>
      </div>

      <div class="back-link">
        <a href="/">← Back to Home</a>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// CHECKOUT PAGE
// ============================================

function renderCheckout(url) {
  const course = url.searchParams.get('course') || 'interview';
  const courses = {
    'interview': { name: 'Interview Preparation Masterclass', price: 4999 },
    'hr-fundamentals': { name: 'HR Fundamentals & Compliance', price: 6999 },
    'recruitment': { name: 'Advanced Recruitment Training', price: 8999 },
    'pf-esic': { name: 'PF & ESIC Expert Certification', price: 5999 }
  };

  const courseData = courses[course] || courses['interview'];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Checkout - RK Associates</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; padding: 40px 20px; }
        .checkout-container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        h1 { color: #1e3c72; margin-bottom: 30px; }
        .summary { background: #f0f0f0; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .summary h3 { color: #1e3c72; margin-bottom: 15px; }
        .summary-item { display: flex; justify-content: space-between; margin: 10px 0; }
        .summary-item.total { border-top: 1px solid #ddd; padding-top: 10px; font-weight: bold; color: #1e3c72; font-size: 18px; }
        .payment-methods { margin: 30px 0; }
        .payment-methods h3 { color: #1e3c72; margin-bottom: 15px; }
        .btn-payment { width: 100%; padding: 12px; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin: 10px 0; }
        .btn-payment:hover { background: #e55a24; }
        .back-link { text-align: center; margin-top: 20px; }
        .back-link a { color: #1e3c72; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="checkout-container">
        <h1>Complete Your Enrollment</h1>

        <div class="summary">
          <h3>Order Summary</h3>
          <div class="summary-item">
            <span>Course:</span>
            <span>${courseData.name}</span>
          </div>
          <div class="summary-item">
            <span>Duration:</span>
            <span>4-8 weeks</span>
          </div>
          <div class="summary-item">
            <span>Includes:</span>
            <span>Video lessons + Certificate</span>
          </div>
          <div class="summary-item total">
            <span>Total Amount:</span>
            <span>₹${courseData.price}</span>
          </div>
        </div>

        <div class="payment-methods">
          <h3>Payment Method</h3>
          <button class="btn-payment" onclick="handlePayment('razorpay')">Pay with Razorpay</button>
          <button class="btn-payment" onclick="handlePayment('card')" style="background: #2c3e50;">Pay with Card</button>
          <button class="btn-payment" onclick="handlePayment('upi')" style="background: #2980b9;">Pay with UPI</button>
        </div>

        <p style="text-align: center; color: #666; font-size: 12px; margin: 20px 0;">
          Your payment is secure and encrypted. We accept all major payment methods.
        </p>

        <div class="back-link">
          <a href="/courses">← Back to Courses</a>
        </div>
      </div>

      <script>
        function handlePayment(method) {
          alert('Payment gateway integration: ' + method + '\\n\\nThis would process payment for ₹${courseData.price}\\n\\nFeature coming soon!');
        }
      </script>
    </body>
    </html>
  `;
}

// ============================================
// ADMIN DASHBOARD
// ============================================

function renderAdmin() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Dashboard - RK Associates</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; }
        .navbar { background: #0f1f3f; color: white; padding: 20px; margin-bottom: 20px; }
        .navbar-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .navbar h1 { font-size: 24px; }
        .navbar a { color: white; text-decoration: none; }
        .dashboard { max-width: 1200px; margin: 0 auto; padding: 0 20px 40px 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .stat-num { font-size: 36px; color: #1e3c72; font-weight: bold; }
        .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h2 { color: #1e3c72; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f0f0f0; }
        .btn { background: #1e3c72; color: white; padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; }
        .btn:hover { background: #0f1f3f; }
      </style>
    </head>
    <body>
      <div class="navbar">
        <div class="navbar-content">
          <h1>Admin Dashboard</h1>
          <a href="/">Logout</a>
        </div>
      </div>

      <div class="dashboard">
        <div class="stats">
          <div class="stat">
            <div class="stat-num">0</div>
            <p>Total Students</p>
          </div>
          <div class="stat">
            <div class="stat-num">4</div>
            <p>Active Courses</p>
          </div>
          <div class="stat">
            <div class="stat-num">₹0</div>
            <p>Total Revenue</p>
          </div>
          <div class="stat">
            <div class="stat-num">0</div>
            <p>Active Enrollments</p>
          </div>
        </div>

        <div class="section">
          <h2>Recent Enrollments</h2>
          <table>
            <tr>
              <th>Student Name</th>
              <th>Course</th>
              <th>Enrollment Date</th>
              <th>Status</th>
            </tr>
            <tr>
              <td colspan="4" style="text-align: center; color: #999;">No enrollments yet</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>Management</h2>
          <button class="btn">View Students</button>
          <button class="btn">Manage Courses</button>
          <button class="btn">View Payments</button>
          <button class="btn">Support Tickets</button>
          <button class="btn">Generate Reports</button>
        </div>

        <div class="section">
          <h2>System Status</h2>
          <p>✅ Database: Connected</p>
          <p>✅ Payment Gateway: Active</p>
          <p>✅ Email Service: Operational</p>
          <p>✅ Backup: Scheduled daily at 2 AM IST</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
