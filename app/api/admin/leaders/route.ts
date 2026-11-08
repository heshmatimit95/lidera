import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

// GET: دریافت لیست تمام لیدرها
export async function GET() {
  try {
    const leaders = await prisma.leader.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(leaders, { status: 200 });
  } catch (error) {
    console.error('Error fetching leaders:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات از دیتابیس' }, { status: 500 });
  }
}

// POST: ثبت لیدر جدید کاملاً منطبق با اسکمای شما
export async function POST(request: Request) {

try {
    const body = await request.json();

    // تولید یا گرفتن اسلاگ یکتا
    const generatedSlug = body.slug || body.username || `leader_${Date.now()}`;

    // هش کردن رمز عبور
    const rawPassword = body.password || '123456';
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    const newLeader = await prisma.leader.create({
      data: {
        slug: generatedSlug,
        name: body.name || '',
        lastname: body.lastname || '',
        fullName: `${body.name || ''} ${body.lastname || ''}`.trim(),
        username: body.username || null,
        mobile: body.phone || body.mobile || null,
        nationalId: body.nationalCode || body.nationalId || null,
        password: hashedPassword,
        status: body.status || 'ACTIVE',
      },
    });

    return NextResponse.json(newLeader, { status: 201 });

   
  } catch (error) {
    console.error('Error creating leader:', error);
    return NextResponse.json({ error: 'خطا در ثبت اطلاعات در دیتابیس (احتمالاً نام کاربری یا موبایل تکراری است)' }, { status: 500 });
  }
}