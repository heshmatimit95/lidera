import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/db';
import { requireActiveLeader } from '../../lib/auth';
import { isActive } from '../../lib/leader-status';
import { checkRateLimit } from '../../lib/rate-limit';

const ALLOWED_PAYMENT_METHODS = ['card', 'gateway', 'both'];

const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';

const toEnglishDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
   .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

// فیلدهای عمومی (برای صفحه ثبت‌نام مسافران): بدون رمز، کد ملی، مرچنت و مسافر
const PUBLIC_SELECT = {
  id: true,
  slug: true,
  name: true,
  fullName: true,
  paymentMethod: true,
  status: true,
  tours: {
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, title: true, price: true, date: true,
      images: true, image1: true, image2: true, image3: true, image4: true,
      tourImages: { select: { url: true } },
    },
  },
  cards: { select: { id: true, cardNumber: true, bankName: true, cardHolder: true } },
} satisfies Prisma.LeaderSelect;

// فیلدهای خصوصی (فقط خود لیدر): بدون password
const PRIVATE_SELECT = {
  ...PUBLIC_SELECT,
  mobile: true,
  username: true,
  mustChangePassword: true,
  passengers: {
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, fullName: true, mobile: true, nationalId: true, tourName: true,
      paymentStatus: true, insurance: true, receiptDate: true, amount: true,
      seatsCount: true, receiptImage: true, createdAt: true,
      // idCardImage عمداً نیست (حساس و سنگین؛ فقط با route جدا و چک مالکیت)
    },
  },
} satisfies Prisma.LeaderSelect;

// GET: اطلاعات عمومی لیدر برای همه، اطلاعات کامل فقط برای خود لیدر
export async function GET(request: Request) {
  try {
    const rl = checkRateLimit(`li:${clientIp(request)}`, 60, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, message: 'درخواست بیش از حد. کمی بعد تلاش کنید.' },
        { status: 429 }
      );
    }

    const sp = new URL(request.url).searchParams;
    const slug = (sp.get('slug') || sp.get('leader') || sp.get('tenantId') || '').trim().slice(0, 64);

    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'اسلاگ یا شناسه لیدر ارسال نشده است' },
        { status: 400 }
      );
    }

    // بدون fallback به «اولین لیدر»
    const found = await prisma.leader.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      select: { id: true, status: true },
    });

    if (!found) {
      return NextResponse.json(
        { success: false, message: 'تورلیدر مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    if (!isActive(found.status)) {
      return NextResponse.json(
        { success: false, message: 'حساب کاربری این لیدر موقتاً مسدود یا غیرفعال است' },
        { status: 403 }
      );
    }

    // آیا درخواست‌دهنده خود همین لیدر (با توکن معتبر) است؟
    const auth = await requireActiveLeader({ allowMustChange: true });
    const isOwner = auth.ok && auth.leader.id === found.id;

    const leader = isOwner
      ? await prisma.leader.findUnique({ where: { id: found.id }, select: PRIVATE_SELECT })
      : await prisma.leader.findUnique({ where: { id: found.id }, select: PUBLIC_SELECT });

    return NextResponse.json(
      { success: true, leader },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching leader info:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور در دریافت اطلاعات لیدر' },
      { status: 500 }
    );
  }
}

// PUT: بروزرسانی نوع پرداخت و کارت‌های خود لیدر (تورها از این route تغییر نمی‌کنند)
export async function PUT(request: Request) {
  try {
    const auth = await requireActiveLeader();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }
    const leaderId = auth.leader.id; // فقط از توکن، نه از ورودی

    const rl = checkRateLimit(`li-put:${leaderId}`, 20, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, message: 'تعداد درخواست‌ها زیاد است. بعداً تلاش کنید.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'درخواست نامعتبر است' }, { status: 400 });
    }

    const data: Prisma.LeaderUpdateInput = {};

    // نوع پرداخت: فقط مقادیر مجاز
    if (body.paymentMethod !== undefined) {
      if (!ALLOWED_PAYMENT_METHODS.includes(body.paymentMethod)) {
        return NextResponse.json({ success: false, message: 'نوع پرداخت نامعتبر است' }, { status: 400 });
      }
      data.paymentMethod = body.paymentMethod;
    }

    // کارت‌ها: حداکثر ۴، شماره ۱۶ رقمی، طول رشته‌ها محدود
    if (body.cards !== undefined) {
      if (!Array.isArray(body.cards) || body.cards.length > 4) {
        return NextResponse.json(
          { success: false, message: 'حداکثر ۴ کارت مجاز است' },
          { status: 400 }
        );
      }

      const cleaned: { cardNumber: string; cardHolder: string; bankName: string }[] = [];
      for (const c of body.cards) {
        const cardNumber = toEnglishDigits(String(c?.cardNumber ?? '')).replace(/\D/g, '');
        if (!cardNumber) continue; // کارت خالی ذخیره نشود
        if (cardNumber.length !== 16) {
          return NextResponse.json(
            { success: false, message: 'شماره کارت باید ۱۶ رقم باشد' },
            { status: 400 }
          );
        }
        cleaned.push({
          cardNumber,
          cardHolder: String(c?.cardHolder ?? '').trim().slice(0, 60),
          bankName: String(c?.bankName ?? '').trim().slice(0, 40),
        });
      }

      data.cards = { deleteMany: {}, create: cleaned };
    }

    // tours عمداً نادیده گرفته می‌شود: مدیریت تور فقط در api/tours با چک مالکیت

    const updatedLeader = await prisma.leader.update({
      where: { id: leaderId },
      data,
      select: PRIVATE_SELECT, // بدون password
    });

    return NextResponse.json(
      { success: true, message: 'تغییرات با موفقیت ذخیره شد', leader: updatedLeader },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating leader info details:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور در ذخیره اطلاعات' },
      { status: 500 }
    );
  }
}