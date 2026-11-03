import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // ۱. پیدا کردن کاربر در دیتابیس
 const user = await prisma.user.findUnique({
  where: { email },
});

    if (!user) {
      return NextResponse.json(
        { error: 'کاربری با این ایمیل یافت نشد.' },
        { status: 401 }
      );
    }

    // ۲. بررسی صحت رمز عبور
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'رمز عبور اشتباه است.' },
        { status: 401 }
      );
    }

    // ۳. تولید توکن JWT
    const secretKey = process.env.JWT_SECRET || 'your_super_secret_key';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secretKey,
      { expiresIn: '7d' } // اعتبار ۷ روزه
    );

    // ۴. ساخت پاسخ و ست کردن کوکی HttpOnly امن
    const response = NextResponse.json(
      { success: true, message: 'ورود با موفقیت انجام شد.' },
      { status: 200 }
    );

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true, // غیرقابل دسترس برای JavaScript مرورگر (جلوگیری از XSS)
      secure: process.env.NODE_ENV === 'production', // فقط در حالت HTTPS روی سرور واقعی فعال می‌شود
      sameSite: 'strict', // محافظت در برابر CSRF
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // ۷ روز به ثانیه
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور رخ داد.' },
      { status: 500 }
    );
  }
}