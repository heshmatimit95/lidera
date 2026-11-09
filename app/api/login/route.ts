import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from '../../lib/db';
import { checkRateLimit, resetRateLimit } from '../../lib/rate-limit';
import { isActive, isBlocked } from '../../lib/leader-status';

const FAIL = { success: false, error: 'نام کاربری یا رمز عبور اشتباه است' };
// هش ساختگی برای یکسان‌سازی زمان پاسخ (جلوگیری از timing attack)
const DUMMY_HASH = '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
const TOKEN_TTL_SECONDS = 60 * 60 * 12; // ۱۲ ساعت

async function makeToken(payload: Record<string, unknown>, secret: Uint8Array) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret);
}

export async function POST(request: Request) {
  try {
    // ۰. کلید JWT اجباری است؛ بدون fallback
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      console.error('JWT_SECRET تنظیم نشده یا کوتاه است');
      return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
    }
    const secret = new TextEncoder().encode(jwtSecret);

    // ۱. ورودی
    const ip = request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
    const body = await request.json().catch(() => ({}));
    const loginIdentifier = String(body.username ?? body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!loginIdentifier || !password || loginIdentifier.length > 64 || password.length > 128) {
      return NextResponse.json(
        { success: false, error: 'نام کاربری و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    // ۲. محدودیت تلاش (IP و نام کاربری)
    const rl1 = checkRateLimit(`ip:${ip}`, 10, 60_000);
    const rl2 = checkRateLimit(`user:${loginIdentifier}`, 5, 15 * 60_000);
    if (!rl1.success || !rl2.success) {
      return NextResponse.json(
        { success: false, error: 'تلاش بیش از حد. بعداً دوباره امتحان کنید.' },
        { status: 429 }
      );
    }

    // ۳. اول لیدر (فقط با username؛ نه slug)
    const leader = await prisma.leader.findFirst({
      where: { username: { equals: loginIdentifier, mode: 'insensitive' } },
    });

    if (leader) {
      const ok = await bcrypt.compare(password, leader.password ?? DUMMY_HASH);
      if (!ok) return NextResponse.json(FAIL, { status: 401 });

      // وضعیت فقط بعد از تأیید رمز اعلام می‌شود
      if (!isActive(leader.status)) {
        return NextResponse.json(
          {
            success: false,
            error: isBlocked(leader.status)
              ? 'دسترسی شما موقتاً مسدود است. با پشتیبانی تماس بگیرید.'
              : 'حساب شما هنوز تأیید نشده است.',
          },
          { status: 403 }
        );
      }

      resetRateLimit(`user:${loginIdentifier}`);
      const token = await makeToken(
        { role: 'leader', leaderId: leader.id, slug: leader.slug },
        secret
      );
      const res = NextResponse.json({ success: true, role: 'leader', slug: leader.slug });
      res.cookies.set({
        name: 'leader_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: TOKEN_TTL_SECONDS,
      });
      return res;
    }

    // ۴. ادمین (از جدول User، با نقش admin)
    const user = await prisma.user.findUnique({ where: { email: loginIdentifier } });
    const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
    if (!user || !ok) {
      return NextResponse.json(FAIL, { status: 401 });
    }

    resetRateLimit(`user:${loginIdentifier}`);
    const token = await makeToken({ role: 'admin', userId: user.id }, secret);
    const res = NextResponse.json({ success: true, role: 'admin' });
    res.cookies.set({
      name: 'admin_token', // با middleware جدید هماهنگ
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_TTL_SECONDS,
    });
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'خطای داخلی سرور' }, { status: 500 });
  }
}