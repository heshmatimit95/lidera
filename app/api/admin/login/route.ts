import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { checkRateLimit, resetRateLimit } from '@/app/lib/rate-limit';
import { getAdminHash } from '@/app/lib/admin-credential';

const FAIL = { success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
// هش ساختگیِ معتبر؛ برای اینکه زمان پاسخ در حالت «نام کاربری اشتباه» با «رمز اشتباه» یکسان باشد
const DUMMY_HASH = '$2a$12$CwTycUXWue0Thq9StjUM0uJ8.4qTz1l5u1yq0m5G7Zk7oYb0m0Yqa';

async function makeToken(payload: Record<string, unknown>, secret: Uint8Array) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret);
}

// این مسیر فقط برای ورود «ادمین» است. ورود لیدرها از /api/login-leader انجام می‌شود.
export async function POST(request: Request) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      console.error('JWT_SECRET ناقص است');
      return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
    }
    const secret = new TextEncoder().encode(jwtSecret);

    const ip = request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
    const body = await request.json().catch(() => ({}));
    const username = String(body.username ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!username || !password || username.length > 64 || password.length > 128) {
      return NextResponse.json({ success: false, error: 'نام کاربری و رمز الزامی است.' }, { status: 400 });
    }

    const rl1 = checkRateLimit(`ip:${ip}`, 10, 60_000);
    const rl2 = checkRateLimit(`user:${username}`, 5, 15 * 60_000);
    if (!rl1.success || !rl2.success) {
      return NextResponse.json({ success: false, error: 'تلاش بیش از حد. بعداً دوباره امتحان کنید.' }, { status: 429 });
    }

    // ادمین
    const adminUser = (process.env.ADMIN_USERNAME ?? '').trim().toLowerCase();
    const adminHash = await getAdminHash();

    const userMatches = !!adminUser && !!adminHash && username === adminUser;
    const ok = await bcrypt.compare(password, userMatches ? adminHash : DUMMY_HASH).catch(() => false);
    if (!userMatches || !ok) {
      return NextResponse.json(FAIL, { status: 401 });
    }

    resetRateLimit(`user:${username}`);
    const token = await makeToken({ role: 'admin' }, secret);
    const res = NextResponse.json({ success: true, role: 'admin' });
    res.cookies.set({
      name: 'admin_token', value: token, httpOnly: true,
      secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
      path: '/', maxAge: 60 * 60 * 12,
    });
    return res;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}