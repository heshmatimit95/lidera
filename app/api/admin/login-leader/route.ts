import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkRateLimit } from '../../../lib/rate-limit'; // اضافه شدن تابع Rate Limiting

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // ۱. استخراج IP کاربر برای سیستم Rate Limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

    // ۲. بررسی محدودیت تعداد درخواست (حداکثر ۵ تلاش در ۱ دقیقه)
    const rateLimit = checkRateLimit(ip, 5, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, message: `❌ تعداد تلاش‌های ناموفق بیش از حد مجاز. لطفاً پس از ${rateLimit.remainingTime} ثانیه دوباره تلاش کنید.` },
        { status: 429 } // Too Many Requests
      );
    }

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

// 👈 چک کردن وضعیت مسدودی یا عدم تایید لیدر
  if (leader.status === 'BLOCKED') {
    return NextResponse.json(
      { success: false, message: 'دسترسی شما موقتاً مسدود است. با پشتیبانی تماس بگیرید.' },
      { status: 403 }
    );
  }

  if (leader.status === 'PENDING') {
    return NextResponse.json(
      { success: false, message: 'حساب شما هنوز تایید نشده است.' },
      { status: 403 }
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
      maxAge: 60 * 60 * 24 * 7, // اعتبار ۷ روزه
    });

response.cookies.set({
    name: 'must_change_password',
   value: String((leader as any).mustChangePassword ?? false),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // ۷ روز
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