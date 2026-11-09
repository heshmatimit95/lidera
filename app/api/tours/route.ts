import { prisma } from '../../lib/db';
import { NextResponse, NextRequest } from "next/server";
import { requireActiveLeader } from '../../lib/auth';
import { isActive } from '../../lib/leader-status';
import { checkRateLimit } from '../../lib/rate-limit';

const MAX_TOURS_PER_LEADER = 50;
const MAX_IMAGES = 8;
const MAX_HOTELS = 20;
const MAX_SERVICES = 30;

const toEnglishDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
   .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const cleanStr = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

const cleanPrice = (v: unknown): string | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(toEnglishDigits(String(v)).replace(/[^\d]/g, ''));
  return Number.isFinite(n) && n >= 0 && n < 1e12 ? String(n) : null;
};

// فقط تصاویر Cloudinary خودمان
const cleanImages = (v: unknown): string[] => {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, MAX_IMAGES)
    .map((x) => String(x ?? '').trim())
    .filter((s) => {
      if (!s || s.length > 500) return false;
      try {
        const u = new URL(s);
        return u.protocol === 'https:' && u.hostname === 'res.cloudinary.com';
      } catch {
        return false;
      }
    });
};

const cleanServices = (v: unknown): string[] =>
  Array.isArray(v) ? v.slice(0, MAX_SERVICES).map((x) => cleanStr(x, 80)).filter(Boolean) : [];

type HotelIn = { name?: unknown; price?: unknown; desc?: unknown; description?: unknown };
const cleanHotels = (v: unknown) =>
  Array.isArray(v)
    ? (v.slice(0, MAX_HOTELS) as HotelIn[])
        .map((h) => ({
          name: cleanStr(h?.name, 80),
          price: Math.max(0, Math.min(Number(h?.price) || 0, 1e12)),
          description: cleanStr(h?.desc ?? h?.description, 300),
        }))
        .filter((h) => h.name)
    : [];

const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';

const TOUR_SELECT = {
  id: true, name: true, title: true, date: true, price: true, images: true,
  duration: true, startDate: true, endDate: true, services: true,
  image1: true, image2: true, image3: true, image4: true,
  tourImages: { select: { url: true } },
  hotels: true,
} as const;
// اگر یکی از فیلدها (مثل duration یا hotels) در schema شما نام دیگری دارد، همین‌جا تنظیم کن.

// GET: لیست تورها (عمومی برای نمایش به مسافران و لیدر)
export async function GET(request: NextRequest) {
  try {
    const rl = checkRateLimit(`tours-get:${clientIp(request)}`, 60, 60_000);
    if (!rl.success) return NextResponse.json([], { status: 429 });

    const url = new URL(request.url);
    const tenantId = cleanStr(url.searchParams.get('tenantId'), 64);
    if (!tenantId) return NextResponse.json([], { status: 400 });

    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: tenantId }, { slug: tenantId }] },
      select: { id: true, status: true },
    });

    // بررسی مسدود نبودن لیدر در نمایش عمومی (مقایسه‌ی حساس به حروف حذف شد)
    if (!leader || !isActive(leader.status)) return NextResponse.json([], { status: 404 });

    const tours = await prisma.tour.findMany({
      where: { leaderId: leader.id },
      select: TOUR_SELECT,
      orderBy: { createdAt: 'desc' },
      take: MAX_TOURS_PER_LEADER,
    });

    return NextResponse.json(tours);
  } catch (error) {
    console.error('Error fetching tours:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: ایجاد تور جدید (مالکیت از توکن)
export async function POST(request: NextRequest) {
  try {
    const leaderAuth = await requireActiveLeader();
    if (!leaderAuth.ok) {
      return NextResponse.json({ success: false, error: leaderAuth.message }, { status: leaderAuth.status });
    }
    const verifiedLeaderId = leaderAuth.leader.id;

    const rl = checkRateLimit(`tours-post:${verifiedLeaderId}`, 20, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: 'تعداد درخواست‌ها زیاد است' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'درخواست نامعتبر است' }, { status: 400 });
    }

    const count = await prisma.tour.count({ where: { leaderId: verifiedLeaderId } });
    if (count >= MAX_TOURS_PER_LEADER) {
      return NextResponse.json({ error: 'سقف تعداد تور پر شده است' }, { status: 400 });
    }

    const name = cleanStr(body.name ?? body.title, 120);
    const title = cleanStr(body.title ?? body.name, 120);
    if (!name && !title) {
      return NextResponse.json({ error: 'عنوان تور الزامی است' }, { status: 400 });
    }

    let price: string | null = null;
    if (body.price !== undefined && body.price !== null && body.price !== '') {
      price = cleanPrice(body.price);
      if (price === null) return NextResponse.json({ error: 'قیمت نامعتبر است' }, { status: 400 });
    }

    const startDate = body.startDate ? cleanStr(body.startDate, 20) : null;
    const endDate = body.endDate ? cleanStr(body.endDate, 20) : null;
    const date = body.date
      ? cleanStr(body.date, 60)
      : startDate
      ? `${startDate} تا ${endDate || ''}`
      : null;

    const newTour = await prisma.tour.create({
      data: {
        name: name || title,
        title: title || name,
        date,
        price,
        images: cleanImages(body.images),
        duration: body.duration ? cleanStr(body.duration, 40) : null,
        startDate,
        endDate,
        services: cleanServices(body.services),
        tenantId: verifiedLeaderId,
        leader: { connect: { id: verifiedLeaderId } },
        hotels: { create: cleanHotels(body.hotels) },
      },
      select: TOUR_SELECT,
    });

    return NextResponse.json(newTour);
  } catch (error) {
    console.error('Error creating tour:', error);
    return NextResponse.json({ error: 'Failed to create tour' }, { status: 500 });
  }
}

// PUT: ویرایش تور (مالکیت + تراکنش برای هتل‌ها)
export async function PUT(request: NextRequest) {
  try {
    const leaderAuth = await requireActiveLeader();
    if (!leaderAuth.ok) {
      return NextResponse.json({ success: false, error: leaderAuth.message }, { status: leaderAuth.status });
    }
    const leaderId = leaderAuth.leader.id;

    const rl = checkRateLimit(`tours-put:${leaderId}`, 60, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: 'تعداد درخواست‌ها زیاد است' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || !body.id) {
      return NextResponse.json({ error: 'Tour ID required' }, { status: 400 });
    }
    const id = String(body.id);

    // بررسی مالکیت (پاسخ ۴۰۴ یکسان؛ وجود تور دیگران فاش نشود)
    const existingTour = await prisma.tour.findFirst({
      where: { id, leaderId },
      select: { id: true },
    });
    if (!existingTour) {
      return NextResponse.json({ error: 'تور یافت نشد' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const v = cleanStr(body.name, 120);
      if (!v) return NextResponse.json({ error: 'نام نامعتبر است' }, { status: 400 });
      data.name = v;
    }
    if (body.title !== undefined) data.title = cleanStr(body.title, 120);
    if (body.date !== undefined) data.date = cleanStr(body.date, 60);
    if (body.price !== undefined) {
      const v = cleanPrice(body.price);
      if (v === null) return NextResponse.json({ error: 'قیمت نامعتبر است' }, { status: 400 });
      data.price = v;
    }
    if (body.images !== undefined) data.images = cleanImages(body.images);
    if (body.duration !== undefined) data.duration = cleanStr(body.duration, 40);
    if (body.startDate !== undefined) data.startDate = cleanStr(body.startDate, 20);
    if (body.endDate !== undefined) data.endDate = cleanStr(body.endDate, 20);
    if (body.services !== undefined) data.services = cleanServices(body.services);
    // leaderId و tenantId هرگز از ورودی تغییر نمی‌کنند

    const hotelsProvided = Array.isArray(body.hotels);

    const updated = await prisma.$transaction(async (tx) => {
      if (hotelsProvided) {
        await tx.hotel.deleteMany({ where: { tourId: id } });
        (data as any).hotels = { create: cleanHotels(body.hotels) };
      }
      return tx.tour.update({
        where: { id },
        data,
        select: TOUR_SELECT,
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating tour:', error);
    return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 });
  }
}

// DELETE: حذف تور (فقط تور خود لیدر؛ در صورت داشتن مسافر پرداخت‌شده رد می‌شود)
export async function DELETE(request: NextRequest) {
  try {
    const leaderAuth = await requireActiveLeader();
    if (!leaderAuth.ok) {
      return NextResponse.json({ success: false, error: leaderAuth.message }, { status: leaderAuth.status });
    }
    const leaderId = leaderAuth.leader.id;

    const rl = checkRateLimit(`tours-del:${leaderId}`, 20, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: 'تعداد درخواست‌ها زیاد است' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const id = cleanStr(searchParams.get('id'), 64);
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existingTour = await prisma.tour.findFirst({
      where: { id, leaderId },
      select: { id: true },
    });
    if (!existingTour) {
      return NextResponse.json({ error: 'تور یافت نشد' }, { status: 404 });
    }

    // اگر مسافر پرداخت‌شده دارد، حذف نشود (با مقدار واقعی وضعیت پرداخت‌شده در پروژه‌ات تطبیق بده)
    const paidCount = await prisma.passenger.count({
      where: { tourId: id, leaderId, paymentStatus: 'پرداخت شده' },
    });
    if (paidCount > 0) {
      return NextResponse.json(
        { error: 'این تور مسافر پرداخت‌شده دارد و قابل حذف نیست' },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.hotel.deleteMany({ where: { tourId: id } }),
      prisma.tour.deleteMany({ where: { id, leaderId } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tour:', error);
    return NextResponse.json({ error: 'Failed to delete tour' }, { status: 500 });
  }
}