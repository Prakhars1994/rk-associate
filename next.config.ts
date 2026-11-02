import type { NextConfig } from "next";

// Security headers for every page: no framing (clickjacking on the login pages), HTTPS-only, no MIME sniffing.
const securityHeaders=[
  {key:"Strict-Transport-Security",value:"max-age=31536000; includeSubDomains"},
  {key:"X-Frame-Options",value:"DENY"},
  {key:"Content-Security-Policy",value:"frame-ancestors 'none'"},
  {key:"X-Content-Type-Options",value:"nosniff"},
  {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
  {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\" \"https://api.razorpay.com\")"},
];

const nextConfig: NextConfig = {
  output:"standalone",
  async headers(){return [{source:"/:path*",headers:securityHeaders}]},
};

export default nextConfig;
