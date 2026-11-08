import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '../../../lib/db';
import { checkRateLimit } from '../../../lib/rate-limit';
import bcrypt from 'bcryptjs';

// تابع بررسی قدرت رمز عبور (قوانین و پیام‌های راهنما)
function validateStrongPassword(password: string) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return 'رمز عبور باید حداقل شامل ۸ کاراکتر باشد.';
  }
  if (!hasUpperCase || !hasLowerCase) {
    return 'رمز عبور باید شامل حروف بزرگ و کوچک انگلیسی باشد.';
  }
  if (!hasNumbers) {
    return 'رمز عبور باید حداقل یک عدد داشته باشد.';
  }
  if (!hasSpecialChar) {
    return 'رمز عبور باید حداقل یک علامت خاص (مثل @, #, $, !) داشته باشد.';
  }
  return null;
}

export async function PUT(request: Request) {
  try {
    // ۱. احراز هویت لیدر از طریق کوکی
    const token = (await cookies()).get('leader_token')?.value;
    const secret = process.env.JWT_SECRET;
    if (!token || !secret) {
      return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
    }

    let payload: any;
    try {
      const verified = await jwtVerify(token, new TextEncoder().encode(secret));
      payload = verified.payload;
    } catch (e) {
      return NextResponse.json({ message: 'توکن نامعتبر است' }, { status: 401 });
    }

    if (payload.role !== 'leader' || typeof payload.leaderId !== 'string') {
      return NextResponse.json({ message: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const leaderId = payload.leaderId;

    // ۲. محدودیت تلاش (Rate Limit) برای امنیت بیشتر
    const r1 = checkRateLimit(`chpw:${leaderId}`, 5, 15 * 60_000);
    if (!r1.success) {
      return NextResponse.json({ message: 'تلاش بیش از حد. بعداً امتحان کنید.' }, { status: 429 });
    }

    // ۳. خواندن اطلاعات ارسالی از فرانت‌اند
    const body = await request.json().catch(() => ({}));
    const currentPassword = String(body.currentPassword ?? '');
    const newPassword = String(body.newPassword ?? '');

    // بررسی قدرت رمز عبور جدید
    const passwordError = validateStrongPassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 });
    }

    if (newPassword === currentPassword) {
      return NextResponse.json({ message: 'رمز جدید باید با رمز فعلی فرق داشته باشد' }, { status: 400 });
    }

    // ۴. بررسی صحت رمز فعلی در دیتابیس
    const leader = await prisma.leader.findUnique({ where: { id: leaderId } });
    if (!leader || !(await bcrypt.compare(currentPassword, leader.password ?? ''))) {
      return NextResponse.json({ message: 'رمز فعلی اشتباه است' }, { status: 400 });
    }

    // ۵. هش کردن رمز جدید و برداشتن اجبار تغییر رمز
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.leader.update({
      where: { id: leaderId },
      data: {
        password: hashedPassword,
        mustChangePassword: false, // غیرفعال کردن اجبار تغییر رمز پس از تغییر موفق
      },
    });

    return NextResponse.json({ message: 'رمز عبور با موفقیت تغییر کرد' }, { status: 200 });

  } catch (error) {
    console.error('Leader change password error:', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}