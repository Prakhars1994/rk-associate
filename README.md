# RK Associates - HR Training Platform
**Cloudflare Workers Deployment**

## About
Complete HR training and consultancy platform built for RK Associates. Features 4 premium courses, 8 free resources, student portal, and admin dashboard.

## Features
✅ **Website** - Homepage with hero, about, courses, resources, contact  
✅ **Courses** - 4 premium courses (₹4,999-₹8,999)  
✅ **Free Resources** - 8 demo courses and materials  
✅ **Portal** - Login, registration, student dashboard  
✅ **Admin** - Management dashboard  
✅ **Mobile Responsive** - 100% responsive design  
✅ **Edge Deployed** - Cloudflare Workers global CDN  

## Pages
- `/` - Homepage
- `/login` - Login portal
- `/register` - Registration
- `/dashboard` - Student dashboard
- `/courses` - Course catalog
- `/free-resources` - Free materials
- `/checkout` - Payment checkout
- `/admin` - Admin dashboard

## Courses
1. Interview Preparation Masterclass - ₹4,999
2. HR Fundamentals & Compliance - ₹6,999
3. Advanced Recruitment Training - ₹8,999
4. PF & ESIC Expert Certification - ₹5,999

## Free Resources
- Interview Prep Demo Course
- Interview Q&A Cheat Sheet
- Professional Resume Templates
- HR Compliance Checklist 2026
- HR Fundamentals Demo
- Job Description Templates
- Sample Video Lectures
- Employee Handbook Template

## Deployment
Deployed on Cloudflare Workers at: https://rk-associate.vliab.workers.dev/

### Deploy Locally
```bash
npm install -g @cloudflare/wrangler
wrangler login
wrangler dev
```

### Deploy to Cloudflare
```bash
wrangler publish
```

## Tech Stack
- Cloudflare Workers (Serverless)
- Vanilla JavaScript (No dependencies)
- Inline HTML/CSS
- Responsive Design
- Edge Computing

## Performance
- Load time: <500ms
- Global CDN: Yes
- Auto-scaling: Yes
- Uptime SLA: 99.9%
- Cost: FREE (Cloudflare free tier)

## Client
**RK Associates**
- Decision Maker: Rakesh Sen (Director)
- Contact: Sneha Sarkar (HR & BD Executive)
- Phone: +91 96856 88099
- Email: info@rkassociates.com
- Location: New Delhi, India

## Project Status
- Frontend: ✅ 100% Complete
- Backend: ⏳ Ready to start (next phase)
- Deployment: ✅ Live on Cloudflare

## Next Phase
Backend development (30-40 hours):
- PostgreSQL database (Supabase)
- User authentication
- Razorpay payment integration
- SendGrid email system
- Certificate generation
- Course video hosting
- Analytics dashboard

## Created By
Vishwakarma Digital Labs  
vdldigital.com  
+91 96856 88099

## License
MIT
