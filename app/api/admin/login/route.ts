import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const username = body.username || body.adminName || body.user || '';
    const password = body.password || body.pass || '';
    
    const cleanUsername = String(username).trim();
    const cleanPassword = String(password).trim();

    // بررسی ادمین کل
    if ((cleanUsername === 'admin56' || cleanUsername === 'admin') && cleanPassword === 'admin5656') {
      // ساخت ریسپانس موفقیت
      const response = NextResponse.json({ 
        success: true, 
        message: 'ورود موفقیت‌آمیز ادمین کل',
        role: 'admin' 
      });

      // ست کردن کوکیِ مورد انتظار میدلور برای ادمین
      response.cookies.set({
        name: 'admin_token',
        value: 'active_admin_session_token',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24, // 24 ساعت
      });

      return response;
    }

    // بررسی لیدرها در دیتابیس
    try {
      const leader = await prisma.leader.findFirst({
        where: { username: cleanUsername }
      });

      if (leader && leader.password === cleanPassword) {
        const response = NextResponse.json({ 
          success: true, 
          message: 'ورود موفقیت‌آمیز لیدر',
          role: 'leader',
          slug: leader.slug 
        });

        // ست کردن کوکیِ مورد انتظار میدلور برای لیدر
        response.cookies.set({
          name: 'leader_token',
          value: leader.slug,
          httpOnly: true,
          path: '/',
          maxAge: 60 * 60 * 24,
        });

        return response;
      }
    } catch (dbErr) {
      console.error('DB Error:', dbErr);
    }

    return NextResponse.json({ error: '❌ نام کاربری یا رمز عبور اشتباه است.' }, { status: 401 });

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}