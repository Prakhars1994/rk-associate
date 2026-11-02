// Policy pages (/privacy, /terms, /refund-policy). Required by Razorpay for live payments and by the DPDP Act 2023.
export const business={name:"RK Associate (Total HR Solution)",address:"1st Floor, Nainaksh Tower, Deep Nagar, Mandideep, Raisen, Madhya Pradesh – 462046",email:"totalhrsolution2015@gmail.com",phone:"+91 96856 88099",updated:"2 November 2026"};

export type Policy={slug:string;title:string;description:string;intro:string;sections:[string,string[]][]};

export const policies:Record<string,Policy>={
  privacy:{slug:"/privacy",title:"Privacy Policy",description:"How RK Associate collects, uses and protects personal data from enquiries, student accounts and course payments.",
    intro:`This policy explains what personal data ${business.name} ("we", "us") collects through this website, why, and how you can control it. It follows the Digital Personal Data Protection Act, 2023.`,
    sections:[
      ["What we collect",["Enquiry forms: your name, mobile number, email, company, the service or course you are interested in, and your message.","Student accounts: your name, email, mobile number and password (passwords are stored only in encrypted, hashed form by our authentication provider; we never see them).","Courses and payments: the courses you enrol in, your progress, certificates, and payment records (amount, date, Razorpay order and payment IDs). Card, UPI and bank details are entered on Razorpay's secure page and never reach us.","Technical data: your browser type and pages requested, kept briefly in server logs for security and troubleshooting."]],
      ["Why we use it",["To reply to your enquiry and provide the HR, compliance or training service you asked about.","To create and run your student account, deliver courses, track progress and issue certificates.","To process payments, send receipts and meet tax and accounting obligations.","To keep the website secure and prevent fraud or misuse."]],
      ["Who we share it with",["Razorpay (payment processing), Supabase (secure database and login), Cloudflare (website hosting) and our email provider (receipts and account emails). Each processes data only to provide its service to us.","Authorities, where the law requires it.","We do not sell or rent your personal data, and we do not use advertising trackers."]],
      ["How long we keep it",["Enquiries: up to 2 years after our last contact, unless you become a client or student.","Student and payment records: for as long as your account is active and then as long as tax and accounting law requires (generally 8 years for financial records).","Backups are kept for 30 days and then deleted automatically."]],
      ["Your rights",[`You can ask us to access, correct or delete your personal data, or withdraw consent, by emailing ${business.email}. We will respond within 30 days.`,"Deleting your data may mean we can no longer provide a course or certificate, and some payment records must be kept by law."]],
      ["Security",["The website uses HTTPS everywhere. Data is encrypted in transit and at rest, admin access requires two-step login, and access to personal data is limited to RK Associate staff who need it."]],
      ["Cookies and storage",["We do not use advertising or tracking cookies. When you log in, a session token is kept in your browser tab's storage and is cleared when you close the tab or log out."]],
      ["Grievance officer and contact",[`For any privacy question or complaint, contact us at ${business.email} or ${business.phone}, ${business.address}.`]],
    ]},
  terms:{slug:"/terms",title:"Terms & Conditions",description:"Terms for using the RK Associate website, student accounts, HR training courses and online payments.",
    intro:`These terms apply when you use this website, create a student account, enrol in a course or pay online. By doing so you agree to them. The website is operated by ${business.name}, ${business.address}.`,
    sections:[
      ["Services and courses",["We provide HR consultancy, statutory compliance, payroll, recruitment, accounting and taxation services, and practical HR training (online and offline).","Business services are provided under a separate quotation or agreement, which takes priority over these terms for that engagement.","Course content, schedules and trainers may be updated to keep training current. Batch dates are confirmed after enrolment."]],
      ["Student accounts",["You must give accurate details and keep your password private. You are responsible for activity on your account.","One account is for one person. Course access and materials must not be shared.","We may suspend accounts that misuse the platform or break these terms."]],
      ["Fees and payment",["Course fees are shown in Indian Rupees and include applicable taxes unless stated otherwise.","Payments are processed securely by Razorpay. Your enrolment is confirmed once the payment is successful and verified.","Refunds follow our Cancellation & Refund Policy."]],
      ["Certificates",["A certificate is issued when you complete the course and score at least 60% in the HR assignment/assessment."]],
      ["Intellectual property",["Course materials, templates and website content belong to RK Associate. You may use them for your own learning and work, but not resell, publish or redistribute them."]],
      ["Limitation of liability",["Training and resources are educational guidance. For decisions with legal or financial consequences, take advice specific to your situation. To the extent the law allows, our liability for any claim is limited to the fee you paid for the course or service concerned."]],
      ["Governing law",["These terms are governed by the laws of India. Courts at Raisen/Bhopal, Madhya Pradesh have jurisdiction."]],
      ["Contact",[`Questions about these terms: ${business.email} or ${business.phone}.`]],
    ]},
  refund:{slug:"/refund-policy",title:"Cancellation & Refund Policy",description:"Cancellation and refund rules for RK Associate HR training courses paid online.",
    intro:"This policy covers HR training courses paid for on this website. Business services are governed by their own quotation or agreement.",
    sections:[
      ["Cancelling before the course starts",["If you cancel within 7 days of payment and before your batch starts, you get a full refund.","After 7 days, or once your batch has started, the fee is not refundable, but you may move once to a later batch at no extra cost."]],
      ["If we cancel or reschedule",["If RK Associate cancels a batch, you can choose a full refund or a seat in the next batch.","If a batch is rescheduled and the new dates don't suit you, you can ask for a full refund before the new start date."]],
      ["Duplicate or failed payments",["If you were charged twice or a payment failed but money left your account, it is refunded in full once confirmed with Razorpay."]],
      ["How to request a refund",[`Email ${business.email} or WhatsApp ${business.phone} with your name, registered email, course and Razorpay payment ID (shown on your receipt).`,"Approved refunds are made to the original payment method through Razorpay within 7–10 working days."]],
      ["Delivery",["Courses are delivered online and/or at our Mandideep office; nothing is shipped. Access details and batch dates are shared by email, phone or WhatsApp after enrolment."]],
    ]},
};
