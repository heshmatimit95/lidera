import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from '../../../lib/db';
import { checkRateLimit, resetRateLimit } from '../../../lib/rate-limit';
import { isActive, isBlocked } from '../../../lib/leader-status';
const FAIL = { success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
const DUMMY_HASH = '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';

async function makeToken(payload: Record<string, unknown>, secret: Uint8Array) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret);
}

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
    const adminHash = process.env.ADMIN_PASSWORD_HASH ?? '';
    if (adminUser && adminHash && username === adminUser) {
      const ok = await bcrypt.compare(password, adminHash);
      if (!ok) return NextResponse.json(FAIL, { status: 401 });


      

      resetRateLimit(`user:${username}`);
      const token = await makeToken({ role: 'admin' }, secret);
      const res = NextResponse.json({ success: true, role: 'admin' });
      res.cookies.set({
        name: 'admin_token', value: token, httpOnly: true,
        secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
        path: '/', maxAge: 60 * 60 * 12,
      });
      return res;
    }

// بررسی لیدر در دیتابیس
    const leader = await prisma.leader.findFirst({ 
      where: { 
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { slug: { equals: username, mode: 'insensitive' } }
        ]
      } 
    });

    const ok = leader ? await bcrypt.compare(password, leader.password ?? DUMMY_HASH) : false;
    if (!leader || !ok) {
      return NextResponse.json(FAIL, { status: 401 });
    }
if (!isActive(leader.status)) {
  return NextResponse.json(
    { success: false, error: isBlocked(leader.status)
        ? 'دسترسی شما موقتاً مسدود است. با پشتیبانی تماس بگیرید.'
        : 'حساب شما هنوز تأیید نشده است.' },
    { status: 403 }
  );
}
    resetRateLimit(`user:${username}`);
    const token = await makeToken({ role: 'leader', leaderId: leader.id, slug: leader.slug }, secret);
    const res = NextResponse.json({ success: true, role: 'leader', slug: leader.slug });
    res.cookies.set({
      name: 'leader_token', value: token, httpOnly: true,
      secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
      path: '/', maxAge: 60 * 60 * 12,
    });
    
    return res;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}