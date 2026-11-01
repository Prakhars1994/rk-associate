# RK Associates - Future Website Upgrades Roadmap

Based on industry trends and HR platform evolution, here are likely feature requests RK will make as the platform matures.

## Phase 3: Advanced Content & Learning (Q1 2027)

### Live Classes & Webinar Integration
- **Zoom/Teams integration**: Schedule and host live training sessions
- **Recording storage**: Store webinar recordings in R2, link to courses
- **Interactive Q&A**: Real-time Q&A during live sessions
- **Attendance tracking**: Auto-mark attendance for live participants
- *Why*: Self-paced courses are valuable, but live interaction drives engagement and certification credibility

### Adaptive Learning Paths
- **Pre-assessment tests**: Before enrollment, gauge learner's current level
- **Personalized curriculum**: Recommend modules based on role/experience
- **Learning analytics**: Track time-to-completion, module difficulty, drop-off points
- **Competency badges**: Award micro-credentials for completing sub-modules
- *Why*: Different learners have different needs; customization improves outcomes and retention

### Advanced Video Features
- **Video analytics**: Track watch time, pause points, re-watches (identify confusing sections)
- **Multi-language subtitles**: Serve Hindi, regional languages
- **Transcripts with search**: Full transcripts searchable from course
- **Adaptive bitrate streaming**: Adjust video quality based on bandwidth
- *Why*: Professional HR training often spans diverse regions/languages in India; video engagement data drives content improvement

## Phase 4: Certification & Compliance (Q2 2027)

### Blockchain Certificates
- **Verifiable credentials**: Certificates stored on blockchain for tamper-proof verification
- **QR codes on PDFs**: Instant verification when scanned
- **Public registry**: Allow employers to verify candidate certifications in real-time
- *Why*: Addresses credential fraud in HR; makes certs more valuable to learners

### Compliance Audit Trails
- **Complete activity logs**: Who viewed what, when, for how long (for L&D audits)
- **Role-based reporting**: Admins see org-wide completion rates, compliance gaps
- **Batch certification**: Issue certs to multiple users from a compliance checklist
- *Why*: Large orgs (especially regulated industries) need detailed audit trails for ISO/compliance

### Regulatory Compliance Modules
- **Auto-updating legal content**: Modules on latest labor laws, GST, tax, compliance changes
- **Consent & acknowledgment**: Track user sign-off on policies, training completion
- **Attestation workflows**: Multi-step approval for sensitive training completion
- *Why*: RK's clients are primarily compliance-heavy industries (payroll, HR); this is a natural extension

## Phase 5: Enterprise Features (Q3 2027)

### SSO & SCIM Integration
- **SAML/OAuth**: Connect to client's Active Directory or Google Workspace
- **Auto-provisioning**: Auto-add users from HR system, auto-deactivate on termination
- **Team/department sync**: Import org structure, auto-assign courses by department
- *Why*: Enterprise clients (50+ employees) demand this; reduces manual overhead

### Bulk Enrollment & Reporting
- **CSV import**: Batch-upload user lists with role, department, cost center
- **Scheduled enrollment**: Auto-enroll users in courses on specific dates
- **Compliance reports**: Export completion data for L&D audits, ROI calculations
- *Why*: Large orgs can't enroll users one-by-one; they need programmatic workflows

### Custom Branding
- **Client whitelabeling**: RK's clients can rename platform, add own logo/colors
- **Custom domains**: Each client gets branded.client-name.rk-associates.com
- **Email templates**: Clients customize enrollment, reminder, certificate emails
- *Why*: B2B2C model; clients want to rebrand as their own training solution

### API for Integrations
- **REST API for LMS sync**: Integrate with Canvas, Moodle, Workday, SAP SuccessFactors
- **Webhooks**: Trigger external workflows when users complete courses
- **Data export**: Bulk export learner data for third-party analytics
- *Why*: Enterprise clients often have 5+ systems; integration reduces data silos

## Phase 6: Monetization & Marketplace (Q4 2027)

### Trainer Marketplace
- **Trainer profiles**: External experts can upload their own courses
- **Revenue share**: RK takes 30%, trainer gets 70%
- **Quality gate**: Peer review before courses go live
- *Why*: RK can expand catalog without hiring; trainers monetize their expertise

### Upsell & Bundles
- **Course bundles**: "HR Manager Master Pack" (5 courses at 20% discount)
- **Subscription model**: Monthly subscription for unlimited access (vs. pay-per-course)
- **Promotional codes**: Discount codes for bulk enrollments
- *Why*: Increases LTV; subscriptions provide revenue predictability

### Affiliate Program
- **Referral links**: HR consultants, training centers can refer clients
- **Commission tracking**: Auto-calculate commissions per referral
- *Why*: Low-CAC customer acquisition through trusted advisors

## Phase 7: AI-Powered Learning (Q1 2028)

### AI Tutor & Content Generation
- **GPT-powered Q&A**: Learners ask questions, AI explains concepts
- **Auto-generated content**: Input a topic, AI generates draft course outline
- **Quiz generation**: AI creates practice questions from course materials
- **Content audit**: Flag outdated or unclear sections
- *Why*: Reduces content creation overhead; keeps content fresh; improves engagement

### Predictive Analytics
- **Churn prediction**: Identify learners likely to drop out; send interventions
- **Skill gap analysis**: Highlight skills the org is missing, recommend courses
- **ROI prediction**: Forecast which courses deliver best business outcomes
- *Why*: Data-driven L&D; helps justify training budgets

## Phase 8: Mobile-First & Offline (Q2 2028)

### Native Mobile Apps (iOS/Android)
- **Offline mode**: Download courses, view without internet
- **Push notifications**: Enrollment reminders, course progress, completion badges
- **Mobile-optimized videos**: Shorter segments for mobile viewing
- *Why*: Indian learners often on mobile; offline crucial for field staff with spotty connectivity

## Feature Prioritization Matrix

| Feature | Effort | Impact | Priority | Timeline |
|---------|--------|--------|----------|----------|
| Zoom integration | Medium | High | P0 | Q1 2027 |
| Pre-assessment tests | Medium | High | P0 | Q1 2027 |
| Video analytics | Low | Medium | P1 | Q2 2027 |
| Blockchain certs | High | Medium | P2 | Q2 2027 |
| SSO/SCIM | High | Very High | P0 | Q3 2027 |
| Custom branding | High | Very High | P0 | Q3 2027 |
| AI Q&A tutor | Medium | High | P1 | Q1 2028 |
| Mobile app | Very High | Very High | P1 | Q2 2028 |

## Quick Win Opportunities (Next 30 days)

These can be shipped quickly and add real value:

1. **Course preview**: Non-enrolled users can preview first module for free
2. **Email reminders**: Auto-send reminders for incomplete enrollments
3. **Progress bars**: Show % completion on learner dashboard
4. **Search bar**: Find courses by keyword, instructor, topic
5. **User feedback**: Simple "Was this helpful?" at course end
6. **Completion certificate download**: PDF download from /my-courses
7. **Referral tracking**: Track how existing enrollments came from referrals
8. **Newsletter signup**: Collect emails for course announcements

## Technical Debt to Address in Parallel

- Upgrade Supabase from free to Pro (idle pausing is a risk)
- Set up monitoring/alerting (Sentry, LogRocket)
- Performance optimization: Add Redis caching for course listing
- Security: Penetration test, fix any vulnerabilities
- Accessibility: WCAG 2.1 AA compliance

## Success Metrics to Track

- **Engagement**: Course completion rate (target: >60%)
- **NPS**: Net Promoter Score from learners
- **Revenue per user**: ARPU trend
- **Churn**: Monthly/annual attrition rate
- **L&D ROI**: Skills learned → salary increase / time invested

---

**Next sync with RK**: Validate these assumptions, gather actual roadmap priorities.
