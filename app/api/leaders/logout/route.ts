import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  // پاک کردن همه‌ی کوکی‌های لیدر
  for (const name of ['leader_token', 'leader_slug', 'user_role', 'must_change_password']) {
    res.cookies.set({
      name, value: '', path: '/', maxAge: 0,
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    });
  }
  return res;
}