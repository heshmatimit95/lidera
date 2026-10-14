import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
    
    // تولید یک اسلاگ یکتا بر اساس نام کاربری یا نام
  // اگر نام کاربری داد از همان استفاده کن، وگرنه به جای عدد رندوم، یک مقدار ثابت بگذار
const generatedSlug = body.username;

    const newLeader = await prisma.leader.create({
      data: {
        slug: generatedSlug,
        name: body.name || '',
        lastName: body.lastName || '',
        fullName: `${body.name || ''} ${body.lastName || ''}`.trim(),
        username: body.username || null,
        mobile: body.phone || body.mobile || null, // پشتیبانی از هر دو نام فیلد
        nationalId: body.nationalCode || body.nationalId || null,
        password: body.password || '123456',
        status: body.status || 'ACTIVE',
      },
    });

    return NextResponse.json(newLeader, { status: 201 });
  } catch (error) {
    console.error('Error creating leader:', error);
    return NextResponse.json({ error: 'خطا در ثبت اطلاعات در دیتابیس (احتمالاً نام کاربری یا موبایل تکراری است)' }, { status: 500 });
  }
}