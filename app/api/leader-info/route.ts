import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: دریافت اطلاعات یک لیدر خاص بر اساس slug یا id به همراه تورها، کارت‌ها و مسافران
export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const slug = searchParams.get('slug') || searchParams.get('leader') || searchParams.get('tenantId');
    
    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'اسلاگ یا شناسه لیدر ارسال نشده است' },
        { status: 400 }
      );
    }

    let leader = await prisma.leader.findUnique({
      where: { slug: slug },
      include: {
        tours: true, 
        cards: true,
        passengers: {
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    if (!leader) {
      leader = await prisma.leader.findUnique({
        where: { id: slug },
        include: {
          tours: true,
          cards: true,
          passengers: {
            orderBy: { createdAt: 'desc' }
          },
        },
      });
    }

    if (!leader) {
      leader = await prisma.leader.findFirst({
        include: {
          tours: true,
          cards: true,
          passengers: {
            orderBy: { createdAt: 'desc' }
          },
        },
      });
    }

    if (!leader) {
      return NextResponse.json(
        { success: false, message: 'تورلیدر مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, leader }, { status: 200 });
  } catch (error) {
    console.error('Error fetching leader info:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور در دریافت اطلاعات لیدر' },
      { status: 500 }
    );
  }
}

// PUT: بروزرسانی اطلاعات لیدر، نوع پرداخت، تورها و کارت‌ها در دیتابیس
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("Received Leader Update Body:", body); // برای دیباگ در ترمینال

    // پشتیبانی از نام‌های مختلف شناسه لیدر که ممکن است از فرانت‌اند بیاید
    const leaderKey = body.leaderId || body.tenantId || body.slug;
    const { tours, cards, paymentMethod } = body;

    if (!leaderKey) {
      return NextResponse.json(
        { success: false, message: 'شناسه یا اسلاگ لیدر ارسال نشده است' },
        { status: 400 }
      );
    }

    // ابتدا لیدر را پیدا می‌کنیم تا مطمئن شویم شناسه/اسلاگ معتبر است
    const existingLeader = await prisma.leader.findFirst({
      where: { OR: [{ id: leaderKey }, { slug: leaderKey }, { username: leaderKey }] }
    });

    if (!existingLeader) {
      return NextResponse.json(
        { success: false, message: 'لیدر مورد نظر در دیتابیس یافت نشد' },
        { status: 404 }
      );
    }

    // بروزرسانی اطلاعات در دیتابیس
    const updatedLeader = await prisma.leader.update({
      where: { id: existingLeader.id },
      data: {
        // ذخیره نوع پرداخت در صورت وجود فیلد آن در دیتابیس لیدر
        ...(paymentMethod ? { paymentMethod } : {}),
        
        tours: tours ? {
          deleteMany: {},
          create: tours.map((t: any) => ({
            name: t.name,
            images: t.images || [],
          }))
        } : undefined,

        cards: cards ? {
          deleteMany: {},
          create: cards.map((c: any) => ({
            cardNumber: c.cardNumber || '',
            cardHolder: c.cardHolder || '',
            bankName: c.bankName || '',
          }))
        } : undefined,
      },
      include: {
        tours: true,
        cards: true,
        passengers: {
          orderBy: { createdAt: 'desc' }
        },
      }
    });

    return NextResponse.json(
      { success: true, message: 'تغییرات با موفقیت در دیتابیس ذخیره شد', leader: updatedLeader },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating leader info details:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطای سرور در ذخیره اطلاعات' },
      { status: 500 }
    );
  }
}