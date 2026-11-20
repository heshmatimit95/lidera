/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

// سیاست محتوا (CSP): فقط از منابع شناخته‌شده اجازه‌ی بارگذاری می‌دهد.
// ⚠️ ابتدا به‌صورت Report-Only (فقط گزارش در کنسول مرورگر، بدون مسدود کردن) فعال است
// تا مطمئن شویم چیزی از سایت نمی‌شکند. بعد از چند روز بدون خطا، نام هدر را به
// 'Content-Security-Policy' تغییر بده تا اجباری شود.
const csp = [
  "default-src 'self'",
  // Next.js به اسکریپت‌های inline نیاز دارد؛ در حالت توسعه eval هم لازم است
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  // همیشه از HTTPS استفاده شود (یک سال؛ شامل زیردامنه‌ها)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // جلوگیری از قرار گرفتن سایت داخل iframe سایت‌های دیگر (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // جلوگیری از حدس زدن نوع فایل توسط مرورگر
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // آدرس کامل صفحه فقط به خود سایت داده می‌شود (اسلاگ و پارامترها به بیرون نشت نمی‌کنند)
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // دسترسی به دوربین، میکروفون و مکان برای صفحات سایت بسته است
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // فعلاً فقط گزارش (مسدود نمی‌کند)
  { key: 'Content-Security-Policy-Report-Only', value: csp },
];

const nextConfig = {
  // نسخه‌ی Next.js را در هدر پاسخ نشان نده
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;