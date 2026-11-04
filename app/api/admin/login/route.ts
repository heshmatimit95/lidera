import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

    const secretKey = process.env.JWT_SECRET || 'your_super_secret_key';

    // بررسی ادمین کل
    if ((cleanUsername === 'admin' || cleanUsername === 'admin') && cleanPassword === 'Anisa56') {
      
      // ساخت توکن JWT برای ادمین
      const token = jwt.sign({ username: cleanUsername, role: 'admin' }, secretKey, { expiresIn: '1d' });

      const response = NextResponse.json({ 
        success: true, 
        message: 'ورود موفقیت‌آمیز ادمین کل',
        role: 'admin' 
      });

      // ست کردن کوکی امن با نام token (که میدلور چک می‌کند)
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
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
        
        // ساخت توکن JWT برای لیدر
        const token = jwt.sign({ username: leader.username, role: 'leader', slug: leader.slug }, secretKey, { expiresIn: '1d' });

        const response = NextResponse.json({ 
          success: true, 
          message: 'ورود موفقیت‌آمیز لیدر',
          role: 'leader',
          slug: leader.slug 
        });

        // ست کردن کوکی امن با نام token
        response.cookies.set({
          name: 'token',
          value: token,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24, // 24 ساعت
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