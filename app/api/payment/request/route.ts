import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { isActive } from '../../../lib/leader-status';
import { checkRateLimit } from '../../../lib/rate-limit';

// ─── تنظیمات ────────────────────────────────────────────────
const SITE_URL = (process.env.SITE_URL || 'https://lidera.ir').replace(/\/$/, '');
// پیش‌فرض sandbox است؛ برای حالت واقعی در Render مقدار ZARINPAL_SANDBOX=false بگذار
const IS_SANDBOX = process.env.ZARINPAL_SANDBOX !== 'false';
const ZP_HOST = IS_SANDBOX ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com';
const MAX_SEATS = 10;
const MIN_RIAL = 10_000; // حداقل مبلغ مجاز زرین‌پال
const STATUS_PENDING = 'در انتظار پرداخت';

const toEnglishDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
   .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const cleanStr = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const digitsOnly = (v: unknown, max: number) =>
  toEnglishDigits(String(v ?? '')).replace(/\D/g, '').slice(0, max);

const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';

// تماس با زرین‌پال با مهلت ۱۰ ثانیه
async function zarinpalPost(path: string, payload: object) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(`${ZP_HOST}/pg/v4/payment/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
      cache: 'no-store',
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  try {
    // ۱. محدودیت درخواست (عمومی است)
    const rl = checkRateLimit(`payreq:${clientIp(request)}`, 5, 10 * 60_000);
    if (!rl.success) {
      return NextResponse.json({ success: false, message: 'درخواست زیاد است. کمی بعد تلاش کنید.' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'درخواست نامعتبر است' }, { status: 400 });
    }

    // ۲. ورودی‌ها (مبلغ هرگز از کلاینت خوانده نمی‌شود)
    const leaderKey = cleanStr(body.leaderId ?? body.tenantId ?? body.slug, 64);
    const tourId = cleanStr(body.tourId, 64);
    const hotelId = body.hotelId ? cleanStr(body.hotelId, 64) : null;
    const fullName = cleanStr(body.fullName ?? body.passengerData?.fullName, 80);
    const mobile = digitsOnly(body.mobile ?? body.phone ?? body.passengerData?.mobile ?? body.passengerData?.phone, 11);
    const nationalId = digitsOnly(body.nationalId ?? body.passengerData?.nationalId, 10);
    const birthDate = cleanStr(body.birthDate ?? body.passengerData?.birthDate, 10) || null;
    const seats = Math.floor(Number(body.seatsCount ?? body.passengerData?.seatsCount ?? 1));

    if (!leaderKey || !tourId) return NextResponse.json({ success: false, message: 'اطلاعات تور ناقص است' }, { status: 400 });
    if (!fullName) return NextResponse.json({ success: false, message: 'نام و نام خانوادگی الزامی است' }, { status: 400 });
    if (!/^09\d{9}$/.test(mobile)) return NextResponse.json({ success: false, message: 'شماره موبایل نامعتبر است' }, { status: 400 });
    if (!/^\d{10}$/.test(nationalId)) return NextResponse.json({ success: false, message: 'کد ملی باید ۱۰ رقم باشد' }, { status: 400 });
    if (!Number.isFinite(seats) || seats < 1 || seats > MAX_SEATS) {
      return NextResponse.json({ success: false, message: 'تعداد نفرات نامعتبر است' }, { status: 400 });
    }
    if (body.hasAcceptedWaiver !== true) {
      return NextResponse.json({ success: false, message: 'پذیرش تعهدنامه الزامی است' }, { status: 400 });
    }

    // ۳. لیدر باید فعال باشد
    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: leaderKey }, { slug: leaderKey }] },
      select: { id: true, slug: true, status: true, zarinpalMerchantId: true },
    });
    if (!leader || !isActive(leader.status)) {
      return NextResponse.json({ success: false, message: 'ثبت‌نام این تور فعال نیست' }, { status: 403 });
    }

    // ۴. تور باید متعلق به همین لیدر باشد؛ قیمت از دیتابیس
    const tour = await prisma.tour.findFirst({
      where: { id: tourId, leaderId: leader.id },
      select: { id: true, name: true, title: true, date: true, price: true, hotels: { select: { id: true, name: true, price: true } } },
    });
    if (!tour) return NextResponse.json({ success: false, message: 'تور یافت نشد' }, { status: 404 });

    // ۵. هتل: اگر تور هتل دارد، انتخاب الزامی است و باید از هتل‌های همین تور باشد
    let hotel: { id: string; name: string; price: number } | null = null;
    if (tour.hotels.length > 0) {
      hotel = tour.hotels.find((h) => h.id === hotelId) || null;
      if (!hotel) return NextResponse.json({ success: false, message: 'لطفاً هتل را انتخاب کنید' }, { status: 400 });
    }

    // ۶. 💰 مبلغ نهایی فقط سمت سرور: (قیمت تور + قیمت هتل) × نفرات
    const tourPrice = Number(toEnglishDigits(String(tour.price ?? '')).replace(/\D/g, '')) || 0;
    const unitPrice = tourPrice + (hotel ? Math.round(hotel.price) : 0);
    const amountToman = unitPrice * seats;
    const amountRial = amountToman * 10;
    if (!Number.isFinite(amountRial) || amountRial < MIN_RIAL) {
      return NextResponse.json({ success: false, message: 'مبلغ تور نامعتبر است' }, { status: 400 });
    }

    // ۷. مرچنت: مخصوص لیدر، یا مقدار سراسری. در حالت واقعی مقدار پیش‌فرض ساختگی وجود ندارد
    const merchant =
      leader.zarinpalMerchantId ||
      process.env.ZARINPAL_MERCHANT ||
      (IS_SANDBOX ? '00000000-0000-0000-0000-000000000000' : '');
    if (!merchant) {
      return NextResponse.json({ success: false, message: 'درگاه پرداخت این لیدر تنظیم نشده است' }, { status: 503 });
    }

    // ۸. مسافر «در انتظار پرداخت» ساخته یا (در تلاش مجدد) به‌روزرسانی می‌شود
    const existing = await prisma.passenger.findFirst({
      where: { leaderId: leader.id, nationalId, tourId: tour.id },
      select: { id: true, paymentStatus: true },
    });
    if (existing && existing.paymentStatus !== STATUS_PENDING) {
      return NextResponse.json({ success: false, message: 'با این کد ملی قبلاً برای این تور ثبت‌نام شده است' }, { status: 409 });
    }

    const baseLabel = `${tour.title || tour.name || 'تور'}${tour.date ? ` (${tour.date})` : ''}`;
    const tourName = hotel ? `${baseLabel} - هتل ${hotel.name}` : baseLabel;

    const passengerData = {
      fullName,
      mobile,
      nationalId,
      birthDate,
      tourName,
      tourId: tour.id,
      seatsCount: seats,
      amount: String(amountToman),
      paymentStatus: STATUS_PENDING,
      insurance: false,
      hasAcceptedWaiver: true,
      waiverSignedAt: new Date(),
      leaderId: leader.id,
      tenantId: leader.id,
    };

    const passenger = existing
      ? await prisma.passenger.update({
          where: { id: existing.id },
          data: { ...passengerData, paymentAuthority: null, paymentRefId: null },
          select: { id: true },
        })
      : await prisma.passenger.create({ data: passengerData, select: { id: true } });

    // ۹. درخواست پرداخت از زرین‌پال (آدرس بازگشت ثابت است؛ هیچ داده‌ی حساسی در آن نیست)
    const zp = await zarinpalPost('request.json', {
      merchant_id: merchant,
      amount: amountRial,
      callback_url: `${SITE_URL}/api/payment/verify`,
      description: tourName.slice(0, 200),
      metadata: { mobile },
    });

    const authority: string | undefined = zp?.data?.authority;
    if (zp?.data?.code !== 100 || !authority) {
      console.error('Zarinpal request failed:', JSON.stringify(zp?.errors ?? zp));
      return NextResponse.json({ success: false, message: 'خطا در اتصال به درگاه پرداخت' }, { status: 502 });
    }

    // ۱۰. Authority روی همین مسافر ذخیره می‌شود؛ verify فقط با همین کلید کار می‌کند
    await prisma.passenger.update({
      where: { id: passenger.id },
      data: { paymentAuthority: authority },
    });

    return NextResponse.json({ success: true, url: `${ZP_HOST}/pg/StartPay/${authority}` });
  } catch (error) {
    console.error('Payment request error:', error);
    return NextResponse.json({ success: false, message: 'خطای سرور در ایجاد پرداخت' }, { status: 500 });
  }
}