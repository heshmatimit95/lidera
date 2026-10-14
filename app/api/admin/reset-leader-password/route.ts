import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // دریافت اطلاعات ارسالی از فرم (شامل شناسه و رمز جدید)
    const { leaderId, newPassword } = await request.json();

    if (!leaderId) {
      return NextResponse.json({ message: 'شناسه یا اسلاگ لیدر معتبر نیست' }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ message: 'رمز عبور جدید نمی‌تواند خالی باشد' }, { status: 400 });
    }

    // به‌روزرسانی رمز عبور در دیتابیس با مقدار واقعی جدید
    const updatedLeader = await prisma.leader.updateMany({
      where: {
        OR: [
          { id: leaderId },
          { slug: leaderId }
        ],
      },
      data: {
        password: newPassword, // استفاده از رمز جدید دریافتی
      },
    });

    if (updatedLeader.count === 0) {
      return NextResponse.json({ message: 'لیدری با این مشخصات یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'رمز با موفقیت تغییر کرد'
    }, { status: 200 });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ message: 'خطا در ارتباط با دیتابیس' }, { status: 500 });
  }
}