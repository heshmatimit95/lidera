import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword) {
      return NextResponse.json({ message: "رمز عبور جدید الزامی است" }, { status: 400 });
    }

    // قرار دادن id به صورت رشته ('1') یا استفاده از ایمیل/نام کاربری ادمین
    await prisma.admin.update({
      where: { id: '1' }, 
      data: { password: newPassword }
    });

    return NextResponse.json({ message: "رمز عبور با موفقیت تغییر یافت" }, { status: 200 });
  } catch (error) {
    console.error("Error changing admin password:", error);
    return NextResponse.json({ message: "خطا در سرور" }, { status: 500 });
  }
}