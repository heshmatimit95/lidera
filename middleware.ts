import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const RESERVED = [
  'admin',
  'api',
  'leader',
  'login',
  'landing',
  'passengers',
  'payment',
  'tours',
  'favicon.ico',
];

async function getPayload(token?: string) {
  const secret = process.env.JWT_SECRET;
  if (!token || !secret || secret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

// زیردامنه‌ی اختصاصی لیدر؟ (مثل ali.myproweb.ir یا ali.localhost)؛ همان منطق TourForm
function isTenantHost(host: string) {
  if (host.includes('myproweb.ir')) {
    const parts = host.split('.');
    return parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'lidera';
  }
  if (host.includes('localhost')) return host.split('.').length > 1;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
  const isLeaderPath = pathname === '/leader' || pathname.startsWith('/leader/');

  // ۱. محافظت از پنل ادمین
  if (isAdminPath && pathname !== '/admin/login') {
    const p = await getPayload(request.cookies.get('admin_token')?.value);
    if (!p || p.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // ۲. محافظت از پنل لیدر: فقط توکن JWT معتبر کافی است
  // (کوکی leader_slug به‌تنهایی قابل جعل است و دیگر ملاک ورود نیست)
  // اجبار تغییر رمز در خود صفحه‌ی /leader از روی دیتابیس انجام می‌شود (ForceChangePassword)
  if (isLeaderPath) {
    const p = await getPayload(request.cookies.get('leader_token')?.value);
    if (!p || p.role !== 'leader') {
      const url = new URL('/login', request.url);
      const slug = request.nextUrl.searchParams.get('slug');
      if (slug) url.searchParams.set('slug', slug);
      return NextResponse.redirect(url);
    }
  }

  // ۲.۵ صفحه‌ی اصلی سایت (lidera.ir) بدون slug → صفحه‌ی فرود
  // لینک‌های لیدر (/?slug=... یا زیردامنه‌ی اختصاصی) مثل قبل فرم مسافر را نشان می‌دهند
  if (pathname === '/') {
    const sp = request.nextUrl.searchParams;
    const hasSlug = sp.get('slug') || sp.get('leader');
    const host = (request.headers.get('host') || '').split(':')[0];
    if (!hasSlug && !isTenantHost(host)) {
      const url = request.nextUrl.clone();
      url.pathname = '/landing';
      return NextResponse.rewrite(url);
    }
  }

  // ۳. لینک اختصاصی لیدر (lidera.ir/username)
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1) {
    const s = segments[0];
    if (!RESERVED.includes(s) && !s.includes('.')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('leader', s);
      url.searchParams.set('slug', s);
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};