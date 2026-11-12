import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { requireAdmin } from '../../../lib/require-admin'; // 👈 تابع امنیتی ادمین
import { generatePassword, hashPassword } from '../../../lib/password';

export async function POST(request: NextRequest) {
  try {
    // 👈 بررسی امنیتی: فقط ادمین مجاز به ریست کردن رمز لیدرها است
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ message: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    // فقط شناسه‌ی لیدر از کلاینت گرفته می‌شود؛ رمز جدید همیشه در سرور و تصادفی ساخته می‌شود
    const body = await request.json().catch(() => ({}));
    const leaderId = String(body.leaderId ?? '').trim().slice(0, 64);

    if (!leaderId) {
      return NextResponse.json({ message: 'شناسه یا اسلاگ لیدر معتبر نیست' }, { status: 400 });
    }

    const target = await prisma.leader.findFirst({
      where: { OR: [{ id: leaderId }, { slug: leaderId }] },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ message: 'لیدری با این مشخصات یافت نشد' }, { status: 404 });
    }

    const newPassword = generatePassword(10);
    await prisma.leader.update({
      where: { id: target.id },
      data: {
        password: await hashPassword(newPassword), // هش bcrypt (قبلاً متن ساده ذخیره می‌شد)
        mustChangePassword: true,                  // لیدر باید در اولین ورود رمز را عوض کند
      },
    });

    return NextResponse.json(
      { message: 'رمز موقت جدید ساخته شد', newPassword }, // فقط همین یک بار برای ادمین
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ message: 'خطا در ارتباط با دیتابیس' }, { status: 500 });
  }
}
