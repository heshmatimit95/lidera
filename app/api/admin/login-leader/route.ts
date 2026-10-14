import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'نام کاربری و رمز عبور الزامی است.' },
        { status: 400 }
      );
    }

    // جستجوی لیدر در دیتابیس بر اساس نام کاربری، اسلاگ یا موبایل
    const leader = await prisma.leader.findFirst({
      where: {
        OR: [
          { username: username },
          { slug: username },
          { mobile: username }
        ]
      }
    });

    // ۱. بررسی اینکه آیا اصلاً لیدری با این مشخصات پیدا شده یا نه
    if (!leader) {
      return NextResponse.json(
        { success: false, message: '❌ خطا: لیدری با این نام کاربری یا موبایل در دیتابیس پیدا نشد!' },
        { status: 401 }
      );
    }

    // ۲. بررسی صحت رمز عبور (اگر اشتباه بود، رمز واقعیِ دیتابیس را روی صفحه چاپ می‌کند تا ببینید)
    if (leader.password !== password) {
      return NextResponse.json(
        { success: false, message: `❌ رمز عبور اشتباه است! (رمز ثبت‌شده در دیتابیس این است: "${leader.password}")` },
        { status: 401 }
      );
    }

    // ساخت پاسخ موفقیت‌آمیز همراه با کوکی
    const response = NextResponse.json(
      { 
        success: true, 
        slug: leader.slug,
        redirectUrl: `/leader?slug=${leader.slug}` 
      },
      { status: 200 }
    );

    response.cookies.set({
      name: 'leader_slug',
      value: leader.slug,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // اعتبار ۷ روزه
    });

    response.cookies.set({
      name: 'user_role',
      value: 'leader',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error) {
    console.error('Leader login error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور در پردازش اطلاعات.' },
      { status: 500 }
    );
  }
}