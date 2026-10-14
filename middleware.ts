import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminToken = request.cookies.get('admin_token')?.value || request.cookies.get('adminToken')?.value;
  const leaderToken = request.cookies.get('leader_token')?.value || request.cookies.get('leaderToken')?.value;

  // بررسی دسترسی ادمین
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // بررسی دسترسی لیدر
  if (pathname.startsWith('/leader')) {
    if (!leaderToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // مدیریت لینک‌های اختصاصی لیدرها (مثل /leader1 یا /leader2)
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1) {
    const potentialLeader = segments[0];
    
    // اگر مسیر شامل پسوند فایل (مثل .png, .jpg, .ico و...) بود، اصلاً ریدایرکت نکن
    const reservedRoutes = ['admin', 'api', 'leader', 'login', 'passengers', 'payment', 'tours', 'favicon.ico'];
    if (!reservedRoutes.includes(potentialLeader) && !potentialLeader.includes('.')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('leader', potentialLeader);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/leader/:path*', '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};