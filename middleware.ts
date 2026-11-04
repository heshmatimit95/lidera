import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ۱. محافظت از مسیرهای حساس (مانند ادمین یا داشبورد) با بررسی کوکی HttpOnly
 const protectedPaths = ['/admin', '/leader'];
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secretKey = process.env.JWT_SECRET || 'your_super_secret_key';
      jwt.verify(token, secretKey);
    } catch (error) {
      // اگر توکن منقضی یا نامعتبر بود، به صفحه لاگین هدایت شود
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ۲. منطق قبلی خودت برای لیدرهای سایت (lidera.ir/username)
  const reservedRoutes = ['admin', 'api', 'leader', 'login', 'landing', 'passengers', 'payment', 'tours', 'favicon.ico'];
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 1) {
    const potentialLeader = segments[0];

    if (!reservedRoutes.includes(potentialLeader) && !potentialLeader.includes('.')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('leader', potentialLeader);
      url.searchParams.set('slug', potentialLeader);
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};