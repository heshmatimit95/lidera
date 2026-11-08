import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, email } = body;
    const loginIdentifier = username || email;

    if (!loginIdentifier || !password) {
      return NextResponse.json({ error: 'نام کاربری و رمز عبور الزامی است' }, { status: 400 });
    }

    let account: any = null;
    let roleType = '';

    // ۱. اول بررسی می‌کنیم آیا لیدر است یا خیر
    account = await prisma.leader.findFirst({
      where: {
        OR: [
          { username: loginIdentifier },
          { slug: loginIdentifier }
        ]
      }
    });

    if (account) {
      roleType = 'leader';
    } else {
      // ۲. اگر لیدر نبود، جدول ادمین/کاربران (user) را بررسی می‌کنیم
      account = await prisma.user.findUnique({
        where: { email: loginIdentifier }
      });
      if (account) {
        roleType = 'admin';
      }
    }

    // اگر هیچ‌کدام پیدا نشدند
    if (!account) {
      return NextResponse.json({ error: 'کاربری با این مشخصات یافت نشد' }, { status: 401 });
    }

    // ۳. بررسی صحت رمز عبور با bcrypt
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'رمز عبور اشتباه است' }, { status: 401 });
    }

    // ۴. تولید توکن JWT متناسب با نقش
    const secretKey = process.env.JWT_SECRET || 'your_super_secret_key';
    const tokenPayload = roleType === 'leader' 
      ? { leaderId: account.id, slug: account.slug, role: 'leader' }
      : { userId: account.id, email: account.email, role: 'admin' };

    const token = jwt.sign(tokenPayload, secretKey, { expiresIn: '7d' });

    // ۵. ساخت پاسخ و ست کردن کوکی امن با نام‌های اختصاصی
    const response = NextResponse.json({
      success: true,
      message: 'ورود با موفقیت انجام شد',
      slug: account.slug || ''
    }, { status: 200 });

    // تنظیم کوکی عمومی و اختصاصی لیدر
    response.cookies.set({
      name: roleType === 'leader' ? 'leader_token' : 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // ۷ روز
    });

    // اگر لیدر بود، کوکی اسلاگ را هم ست می‌کنیم تا پنل راحت‌تر بخواند
    if (roleType === 'leader') {
      response.cookies.set({
        name: 'leader_slug',
        value: account.slug,
        httpOnly: false, // فرانت‌اند نیاز دارد بخواند
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور رخ داد' }, { status: 500 });
  }
}