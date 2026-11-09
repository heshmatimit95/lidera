import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { isActive } from '../../../lib/leader-status';
import { checkRateLimit } from '../../../lib/rate-limit';

const toEnglishDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
   .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const cleanStr = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const digitsOnly = (v: unknown, max: number) =>
  toEnglishDigits(String(v ?? '')).replace(/\D/g, '').slice(0, max);

// فقط تصاویر Cloudinary خودمان
const cleanImageUrl = (v: unknown): string | null => {
  if (!v) return null;
  const s = String(v).trim();
  if (s.length > 500) return null;
  try {
    const u = new URL(s);
    if (u.protocol === 'https:' && u.hostname === 'res.cloudinary.com') return s;
  } catch {}
  return null;
};

export async function POST(request: Request) {
  try {
    // ۱. محدودیت درخواست (عمومی است)
    const ip = request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
    const rl = checkRateLimit(`reg:${ip}`, 10, 10 * 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: 'درخواست زیاد است. کمی بعد تلاش کنید.' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'درخواست نامعتبر است' }, { status: 400 });
    }

    // ۲. کلید لیدر: حتماً رشته (جلوگیری از operator injection)
    const tenantKey = cleanStr(body.tenantId ?? body.leaderId ?? body.slug, 64);
    if (!tenantKey) {
      return NextResponse.json({ error: 'Tenant key required' }, { status: 400 });
    }

    // ۳. پیدا کردن لیدر؛ بدون username
    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: tenantKey }, { slug: tenantKey }] },
      select: { id: true, status: true },
    });
    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    // ۴. وضعیت لیدر
    if (!isActive(leader.status)) {
      return NextResponse.json(
        { success: false, message: 'ثبت‌نام این تور موقتاً غیرفعال است.' },
        { status: 403 }
      );
    }

    // ۵. اعتبارسنجی ورودی
    const fullName = cleanStr(body.fullName, 80);
    const mobile = digitsOnly(body.mobile ?? body.phone, 11);
    const nationalId = digitsOnly(body.nationalId, 10);
    const birthDate = cleanStr(body.birthDate, 10);
    const seats = Math.floor(Number(body.seatsCount ?? body.seats ?? 1));
    const tourId = cleanStr(body.tourId, 64);

    if (!fullName) return NextResponse.json({ error: 'نام الزامی است' }, { status: 400 });
    if (!/^09\d{9}$/.test(mobile)) return NextResponse.json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });
    if (!/^\d{10}$/.test(nationalId)) return NextResponse.json({ error: 'کد ملی باید ۱۰ رقم باشد' }, { status: 400 });
    if (!Number.isFinite(seats) || seats < 1 || seats > 20) {
      return NextResponse.json({ error: 'تعداد صندلی نامعتبر است' }, { status: 400 });
    }
    if (!tourId) return NextResponse.json({ error: 'تور انتخاب نشده است' }, { status: 400 });
    if (body.hasAcceptedWaiver !== true) {
      return NextResponse.json({ error: 'پذیرش تعهدنامه الزامی است' }, { status: 400 });
    }

    // ۶. تور باید متعلق به همین لیدر باشد؛ قیمت از دیتابیس
    const tour = await prisma.tour.findFirst({
      where: { id: tourId, leaderId: leader.id },
      select: { id: true, name: true, title: true, price: true },
    });
    if (!tour) {
      return NextResponse.json({ error: 'تور یافت نشد' }, { status: 404 });
    }
    const unitPrice = Number(toEnglishDigits(String(tour.price ?? '')).replace(/\D/g, ''));
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return NextResponse.json({ error: 'قیمت تور نامعتبر است' }, { status: 400 });
    }
    const totalToman = unitPrice * seats; // مبلغ فقط سمت سرور

    // ۷. جلوگیری از ثبت تکراری (همین کد ملی برای همین تور)
    const tourLabel = tour.title || tour.name;
    const dup = await prisma.passenger.findFirst({
      where: { leaderId: leader.id, nationalId, tourId: tour.id },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json({ error: 'با این کد ملی قبلاً برای این تور ثبت‌نام شده است' }, { status: 409 });
    }

    // ۸. ثبت مسافر؛ وضعیت را سرور تعیین می‌کند
    const passenger = await prisma.passenger.create({
      data: {
        fullName,
        mobile,
        nationalId,
        birthDate: birthDate || null,
        tourName: tourLabel,
        tourId: tour.id,
        seatsCount: seats,
        amount: String(totalToman),
        paymentStatus: 'در انتظار پرداخت',
        insurance: false,
        hasAcceptedWaiver: true,
        waiverSignedAt: new Date(),
        idCardImage: cleanImageUrl(body.idCardImage),
        leaderId: leader.id,
        tenantId: leader.id,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, passengerId: passenger.id, amountInToman: totalToman });
  } catch (error) {
    console.error('Passenger register error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}