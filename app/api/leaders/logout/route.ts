import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  // پاک کردن کوکی لیدر
  res.cookies.set({ name: 'leader_token', value: '', path: '/', maxAge: 0 });
  return res;
}