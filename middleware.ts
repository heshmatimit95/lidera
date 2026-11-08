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
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload;
  } catch {
    return null;
  }
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
if (isLeaderPath) {
    const p = await getPayload(request.cookies.get('leader_token')?.value);
    if (!p || p.role !== 'leader') {
      const url = new URL('/login', request.url);
      const slug = request.nextUrl.searchParams.get('slug'); // اصلاح نام متغیر
      if (slug) url.searchParams.set('slug', slug);
      return NextResponse.redirect(url);
    }

    // بررسی اجبار تغییر رمز عبور در سطح میدل‌ویر
    // (به شرطی که مقدار mustChangePassword هنگام ساخت توکن jwt در فایل لاگین لیدر قرار گرفته باشد)
    if (p.mustChangePassword && !pathname.startsWith('/leader/change-password')) {
      // اگر صفحه تغییر رمز جداگانه داری به آنجا هدایت کن یا بگذار مودال باز بماند
      // اگر از مودال روی صفحه داشبورد استفاده می‌کنی، می‌توانی اجازه بدهی به صفحه اصلی بیاید اما مودال باز بماند، 
      // یا اگر خواهی کلاً صفحه دیگری را ببینی، اینجا ریدایرکت کنی.
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