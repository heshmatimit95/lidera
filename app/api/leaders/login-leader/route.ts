import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from '@/app/lib/db';
import { hashPassword } from '@/app/lib/password';
import { checkRateLimit } from '@/app/lib/rate-limit';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // ۷ روز

const toEnglishDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
   .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

// پیام یکسان برای «کاربر نیست» و «رمز اشتباه است» (جلوگیری از شناسایی نام‌های کاربری)
const BAD_CREDENTIALS = 'نام کاربری یا رمز عبور اشتباه است';
const fail = (message: string, status: number) =>
  NextResponse.json({ success: false, error: message, message }, { status });

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return fail('درخواست نامعتبر است', 400);

    const rawUser = toEnglishDigits(String(body.username ?? '')).trim().slice(0, 64);
    // فاصله‌ی اول/آخر (مثلاً هنگام کپی رمز موقت) نادیده گرفته می‌شود
    const password = String(body.password ?? '').trim().slice(0, 200);
    if (!rawUser || !password) return fail('نام کاربری و رمز عبور الزامی است.', 400);

    // ۱. محدودیت تلاش: هم بر اساس IP و هم بر اساس نام کاربری
    const ipLimit = checkRateLimit(`lgl-ip:${clientIp(request)}`, 20, 10 * 60_000);
    const userLimit = checkRateLimit(`lgl-u:${rawUser.toLowerCase()}`, 6, 10 * 60_000);
    if (!ipLimit.success || !userLimit.success) {
      return fail('تعداد تلاش‌ها زیاد است. چند دقیقه بعد دوباره امتحان کنید.', 429);
    }

    // ۲. پیدا کردن لیدر با نام کاربری، اسلاگ یا موبایل
    const lower = rawUser.toLowerCase();
    const leader = await prisma.leader.findFirst({
      where: { OR: [{ username: lower }, { slug: lower }, { mobile: rawUser }] },
      select: { id: true, slug: true, password: true, status: true, mustChangePassword: true },
    });
    if (!leader) return fail(BAD_CREDENTIALS, 401);

    // ۳. بررسی رمز: هش bcrypt؛ رمزهای قدیمیِ متن ساده هم یک‌بار پذیرفته و همان لحظه هش می‌شوند
    const stored = leader.password ?? '';
    const isHash = /^\$2[aby]\$/.test(stored);
    const passwordOk = isHash ? await bcrypt.compare(password, stored) : stored !== '' && stored === password;
    if (!passwordOk) return fail(BAD_CREDENTIALS, 401);

    if (!isHash) {
      await prisma.leader.update({
        where: { id: leader.id },
        data: { password: await hashPassword(password) },
      });
    }

    // ۴. وضعیت حساب (حروف بزرگ/کوچک تفاوتی ندارد)
    const status = String(leader.status ?? '').toLowerCase();
    if (status === 'blocked') return fail('دسترسی شما موقتاً مسدود است. با پشتیبانی تماس بگیرید.', 403);
    if (status === 'pending') return fail('حساب شما هنوز تایید نشده است.', 403);
    if (status !== 'active') return fail('حساب شما فعال نیست.', 403);

    // ۵. توکن ورود (همان قالبی که requireActiveLeader و صفحه‌ی لیدر انتظار دارند)
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not set');
      return fail('خطای پیکربندی سرور', 500);
    }
    const token = await new SignJWT({ role: 'leader', leaderId: leader.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(secret));

    const response = NextResponse.json(
      {
        success: true,
        slug: leader.slug,
        mustChangePassword: leader.mustChangePassword,
        redirectUrl: `/leader?slug=${leader.slug}`,
      },
      { status: 200 }
    );

    response.cookies.set({ name: 'leader_token', value: token, maxAge: COOKIE_MAX_AGE, ...cookieBase });
    response.cookies.set({ name: 'leader_slug', value: leader.slug, maxAge: COOKIE_MAX_AGE, ...cookieBase });
    response.cookies.set({ name: 'user_role', value: 'leader', maxAge: COOKIE_MAX_AGE, ...cookieBase });
    response.cookies.set({
      name: 'must_change_password',
      value: String(Boolean(leader.mustChangePassword)),
      maxAge: COOKIE_MAX_AGE,
      ...cookieBase,
    });

    return response;
  } catch (error) {
    console.error('Leader login error:', error);
    return fail('خطای سرور در پردازش اطلاعات.', 500);
  }
}

// DELETE: خروج لیدر (کوکی‌ها httpOnly هستند و فقط سرور می‌تواند پاکشان کند)
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  for (const name of ['leader_token', 'leader_slug', 'user_role', 'must_change_password']) {
    response.cookies.set({ name, value: '', maxAge: 0, ...cookieBase });
  }
  return response;
}