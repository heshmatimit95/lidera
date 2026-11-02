import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ۱. حذف مسیرهای استثنا و فایل‌های استاتیک
  const reservedRoutes = ['admin', 'api', 'leader', 'login', 'landing', 'passengers', 'payment', 'tours', 'favicon.ico'];
  
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 1) {
    const potentialLeader = segments[0];

    if (!reservedRoutes.includes(potentialLeader) && !potentialLeader.includes('.')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('leader', potentialLeader);
      url.searchParams.set('slug', potentialLeader);

      // 🚀 به جای NextResponse.redirect از NextResponse.rewrite استفاده کن!
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}