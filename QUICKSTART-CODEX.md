# CODEX QUICKSTART GUIDE - RK ASSOCIATES PROJECT

**Read this first if you're taking over this project.**

---

## 🚀 START HERE (5 MINUTES)

### 1. Clone & Explore
```bash
git clone https://github.com/Prakhars1994/rk-associate.git
cd rk-associate
ls -la
```

**Key files:**
- `src/index.js` ← FRONTEND (All 9 pages, DONE 100%)
- `phase2-api.js` ← BACKEND APIs (Ready to implement)
- `phase2-schema.sql` ← Database (Ready to deploy)
- `PROJECT-HANDOVER.md` ← FULL DOCUMENTATION

### 2. Test the Live Frontend (Right Now!)
Open in browser:
```
https://rk-associate.vliab.workers.dev/
```

**Try these pages:**
- `/` → Homepage
- `/login` → Login page
- `/courses` → Course listing
- `/checkout?course=hr` → Checkout page
- `/admin` → Admin dashboard
- `/portal` → Client portal (5 tabs)

### 3. Understand What's Complete
✅ **Phase 1 (Frontend):** 100% Done
- Homepage with hero, courses, resources
- Login/Register pages
- Student dashboard with progress tracking
- Course listing with enrollment
- Checkout with payment method selection
- Admin dashboard with analytics
- Client support portal with tickets/files

⏳ **Phase 2 (Backend):** 0% Done (All code written, needs Supabase setup)
- Authentication API (JWT)
- Ticket management system
- File upload & storage
- Payment processing (Razorpay)
- Certificate generation
- Email notifications (SendGrid)

---

## 📋 WHAT YOU NEED TO DO NEXT

### Phase 2: Backend Development (20-30 hours)

**Step-by-Step:**

#### 1. Create Supabase Project (Free Tier)
```
https://supabase.com
→ New Project
→ Copy Project URL & Anon Key
```

#### 2. Run Database Schema
```bash
# In Supabase SQL Editor, paste entire phase2-schema.sql
# This creates 13 tables with indexes
```

#### 3. Add Environment Variables
```
SUPABASE_URL = "your-supabase-url"
SUPABASE_KEY = "your-anon-key"
RAZORPAY_KEY_ID = "test-key-from-razorpay"
RAZORPAY_SECRET = "test-secret-from-razorpay"
SENDGRID_API_KEY = "key-from-sendgrid"
```

#### 4. Implement APIs (phase2-api.js)
The code is 90% done. Just need to:
1. Replace credentials at top of file
2. Test each endpoint with Postman
3. Deploy to Cloudflare Workers

#### 5. Connect Frontend to Backend
Update `src/index.js`:
- Login page → Call `/api/auth/login`
- Register page → Call `/api/auth/register`
- Checkout → Call `/api/payments/create`
- Dashboard → Call `/api/tickets`
- Portal → Call `/api/files`, `/api/tickets`

#### 6. Deploy Combined Worker
Merge all into `worker-combined.js` and deploy.

---

## 🔐 CREDENTIALS YOU'LL NEED

### Already Set Up ✅
- **Cloudflare:** Account ID `ac58b62e8f62115bb2a73be4a5202360`
- **GitHub:** `Prakhars1994/rk-associate` (public)

### Need to Create 🆕
- **Supabase:** PostgreSQL database
- **Razorpay:** Payment gateway (test mode)
- **SendGrid:** Email service (free 100/day)

### Get API Keys From:
```
Razorpay:   https://dashboard.razorpay.com/settings/api-keys
SendGrid:   https://sendgrid.com/
Supabase:   https://app.supabase.com/
```

---

## 🎯 YOUR DAILY WORKFLOW

### Day 1: Database Setup
```bash
1. Create Supabase project
2. Run phase2-schema.sql
3. Verify all 13 tables created
4. Test connection from phase2-api.js
```

### Day 2: Auth API
```bash
1. Implement registerUser() function
2. Implement loginUser() function
3. Test with Postman
4. Test in browser (register → login → dashboard)
```

### Day 3: Ticket System
```bash
1. Implement createTicket() function
2. Implement getTickets() function
3. Implement addTicketComment() function
4. Test create → view → comment flow
```

### Day 4: Payments
```bash
1. Get Razorpay test credentials
2. Implement createRazorpayOrder() function
3. Implement verifyPayment() function
4. Test payment flow end-to-end
```

### Day 5: Files & Certificates
```bash
1. Set up Cloudflare R2 bucket
2. Implement uploadFile() function
3. Implement generateCertificate() function
4. Test file upload & download
```

### Day 6: Email Integration
```bash
1. Get SendGrid API key
2. Add email functions to phase2-api.js
3. Test email notifications
4. Test enrollment email flow
```

### Day 7: Frontend Integration
```bash
1. Update login page to call API
2. Update checkout page to call API
3. Update portal to fetch from APIs
4. Test complete user flow
```

### Day 8: Deployment & Testing
```bash
1. Deploy combined worker to Cloudflare
2. Run full end-to-end test
3. Fix any bugs
4. Brief client
5. Go live
```

---

## 💾 GIT WORKFLOW

### Push Your Changes:
```bash
# Make changes
git add .
git commit -m "Description of your changes"
git push origin master
```

### Keep it Updated:
```bash
# Before starting work each day
git pull origin master

# Check status
git status

# See recent commits
git log --oneline -10
```

---

## 🧪 TESTING CHECKLIST

### Frontend Testing:
- [ ] Homepage loads (all 8 sections visible)
- [ ] Login form works (submits & localStorage)
- [ ] Register form works (all fields validate)
- [ ] Dashboard shows 4 stat cards
- [ ] Courses page shows 4 courses
- [ ] Checkout shows correct price for course param
- [ ] Admin dashboard loads
- [ ] Portal has 5 working tabs
- [ ] Mobile responsive (test on 375px width)

### Backend Testing:
- [ ] POST /api/auth/register returns JWT token
- [ ] POST /api/auth/login returns JWT token
- [ ] POST /api/tickets creates ticket in DB
- [ ] GET /api/tickets returns user's tickets
- [ ] POST /api/payments/create returns Razorpay order
- [ ] File upload works with size validation
- [ ] Certificate generation creates PDF
- [ ] Email sends on enrollment

### Integration Testing:
- [ ] User registers → Gets email
- [ ] User logs in → Sees dashboard
- [ ] User enrolls in course → Payment created
- [ ] Payment confirmed → Enrollment recorded
- [ ] User creates ticket → Sees in portal
- [ ] User uploads file → File stored in R2
- [ ] Admin sees all users → Can view tickets
- [ ] Course completion → Certificate generated

---

## 📚 IMPORTANT FILES TO READ

**In this order:**

1. **PROJECT-HANDOVER.md** (This handover document)
   - Complete project overview
   - All file locations
   - Database schema details
   - API endpoints list
   - Credential setup

2. **src/index.js**
   - Read the 9 page functions
   - Understand routing
   - See color scheme & responsive design
   - Plan where to add API calls

3. **phase2-schema.sql**
   - Understand table structure
   - See relationships between tables
   - Note indexes for optimization

4. **phase2-api.js**
   - 90% of backend code is here
   - Understand JWT generation
   - See Razorpay integration pattern
   - Note CORS headers

---

## 🚨 COMMON PITFALLS

### ❌ Don't:
- Modify the frontend without testing on mobile
- Deploy without running schema first
- Forget to add CORS headers to API responses
- Use real Razorpay credentials in dev
- Store secrets in git commits
- Forget to update both `src/index.js` AND `worker-combined.js`

### ✅ Do:
- Test each API endpoint individually before integration
- Use Postman to validate endpoint responses
- Keep frontend and backend versions in sync
- Document any API changes
- Test payment flow with Razorpay test cards
- Create backup of database schema

---

## 🆘 STUCK? QUICK FIXES

**Problem:** "CORS error when calling API"
→ Solution: Add CORS headers to phase2-api.js response

**Problem:** "Supabase connection fails"
→ Solution: Check URL & API key in environment variables

**Problem:** "Frontend doesn't load"
→ Solution: Check Cloudflare Workers editor for syntax errors

**Problem:** "Payment shows error"
→ Solution: Use Razorpay test credentials, not live

**Problem:** "Database schema failed"
→ Solution: Run line-by-line in SQL editor, find error

---

## 📞 CONTACTS IF STUCK

**Original Developer:**
- Prakhar Singh: prakhars389@gmail.com
- GitHub: https://github.com/Prakhars1994

**Client:**
- Sneha (RK Associates): +91 96856 88099
- Email: hr@rkassociate.com

---

## ✨ BONUS: Quick Deploy Checklist

After implementing Phase 2:
```bash
# 1. Make sure all code is in worker-combined.js
# 2. Test locally: wrangler dev
# 3. Deploy to production: wrangler publish
# 4. Test live: https://rk-associate.vliab.workers.dev/
# 5. Test all 9 pages on mobile
# 6. Test auth flow (register → login → dashboard)
# 7. Test payment flow
# 8. Brief client
# 9. Celebrate! 🎉
```

---

## 📊 PROJECT STATS

- **Frontend:** 9 pages, 100% complete, responsive, 35KB
- **Backend:** 13 API endpoints, 90% written, ready to implement
- **Database:** 13 tables, schema ready to deploy
- **Estimated Phase 2 Time:** 20-30 hours
- **Total Project Value:** ~$5,000-7,000 USD

---

**You've got this! The foundation is solid. Now build Phase 2! 🚀**

**Start with:** Creating Supabase project → Run schema → Test database connection

**Good luck, Codex!**
