import { NextResponse } from 'next/server';

export async function PUT() {
  return NextResponse.json(
    { message: 'تغییر رمز از این مسیر غیرفعال است' },
    { status: 410 }
  );
}