import { NextResponse } from 'next/server';
import { prisma } from '../../lib/db';
import { requireActiveLeader } from '../../lib/auth'; // 👈 تابع امنیتی کلود
import { isActive } from '../../lib/leader-status';
import { checkRateLimit } from '../../lib/rate-limit';

const MAX_SEATS = 10;

const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';

const toEnglishDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
   .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const cleanStr = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

// فقط تصاویر Cloudinary خودمان
const cleanImageUrl = (v: unknown): string | null => {
  const s = String(v ?? '').trim();
  if (!s || s.length > 500) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' && u.hostname === 'res.cloudinary.com' ? s : null;
  } catch {
    return null;
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantKey = searchParams.get('tenantId') || searchParams.get('slug') || searchParams.get('leaderId');
    
    // خواندن شماره صفحه برای صفحه‌بندی (پیش‌فرض صفحه ۱)
    const page = Math.max(1, Number(searchParams.get('page')) || 1);

    // 👈 بررسی امنیتی وضعیت لیدر با تابع مشترک
    const auth = await requireActiveLeader();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const leaderId = auth.leader.id;

    if (!tenantKey) {
      const allPassengers = await prisma.passenger.findMany({ 
        where: { leaderId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: (page - 1) * 20,
        select: {
          id: true,
          fullName: true,
          mobile: true,
          nationalId: true,
          tourName: true,
          paymentStatus: true,
          insurance: true,
          receiptDate: true,
          amount: true,
          seatsCount: true,
          createdAt: true,
        }
      });
      const mapped = allPassengers.map((p: any) => ({
        ...p,
        phone: p.phone || p.mobile,
        mobile: p.mobile || p.phone
      }));
      return NextResponse.json(mapped);
    }

    const passengers = await prisma.passenger.findMany({ 
      where: { 
        leaderId: leaderId,
      }, 
      orderBy: { createdAt: 'desc' },
      take: 20, // فقط ۲۰ مسافر در هر صفحه
      skip: (page - 1) * 20,
      select: {
        id: true,
        fullName: true,
        mobile: true,
        nationalId: true,
        tourName: true,
        paymentStatus: true,
        insurance: true,
        receiptDate: true,
        amount: true,
        seatsCount: true,
        createdAt: true,
      }
    });
    
    const mapped = passengers.map((p: any) => ({
      ...p,
      phone: p.phone || p.mobile,
      mobile: p.mobile || p.phone
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('GET passengers error:', error);
    return NextResponse.json({ error: 'Failed to fetch passengers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'درخواست نامعتبر است' }, { status: 400 });
    }

    // ───────────────────────────────────────────────────────────────
    // مسیر ۱: ثبت‌نام عمومی مسافر (فرم کارت‌به‌کارت در صفحه مسافر)
    // نیازی به ورود ندارد؛ ولی همه‌چیز (لیدر، تور، هتل، مبلغ، وضعیت) سمت سرور بررسی می‌شود
    // ───────────────────────────────────────────────────────────────
    const isPublicRegistration = body.paymentMethod === 'card' && !!body.tourId;

    if (isPublicRegistration) {
      const rl = checkRateLimit(`pax-post:${clientIp(request)}`, 5, 10 * 60_000);
      if (!rl.success) {
        return NextResponse.json({ error: 'تعداد درخواست‌ها زیاد است. کمی بعد تلاش کنید.' }, { status: 429 });
      }

      const leaderKey = cleanStr(body.leaderId, 64);
      const tourId = cleanStr(body.tourId, 64);
      const hotelId = body.hotelId ? cleanStr(body.hotelId, 64) : null;

      const fullName = cleanStr(body.fullName, 80);
      const mobile = toEnglishDigits(cleanStr(body.mobile || body.phone, 20));
      const nationalId = toEnglishDigits(cleanStr(body.nationalId, 20));
      const birthDate = body.birthDate ? cleanStr(body.birthDate, 12) : null;
      const seats = Math.min(Math.max(Math.floor(Number(body.seatsCount || body.seats) || 1), 1), MAX_SEATS);
      const receiptImage = cleanImageUrl(body.receiptImage);

      if (!leaderKey || !tourId) return NextResponse.json({ error: 'اطلاعات تور ناقص است' }, { status: 400 });
      if (!fullName) return NextResponse.json({ error: 'نام و نام خانوادگی الزامی است' }, { status: 400 });
      if (!/^09\d{9}$/.test(mobile)) return NextResponse.json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });
      if (!/^\d{10}$/.test(nationalId)) return NextResponse.json({ error: 'کد ملی نامعتبر است' }, { status: 400 });
      if (!receiptImage) return NextResponse.json({ error: 'تصویر فیش واریزی نامعتبر است' }, { status: 400 });

      const leader = await prisma.leader.findFirst({
        where: { OR: [{ id: leaderKey }, { slug: leaderKey }] },
        select: { id: true, status: true },
      });
      if (!leader || !isActive(leader.status)) {
        return NextResponse.json({ error: 'ثبت‌نام این تور فعال نیست' }, { status: 403 });
      }

      // تور باید متعلق به همین لیدر باشد
      const tour = await prisma.tour.findFirst({
        where: { id: tourId, leaderId: leader.id },
        select: { id: true, name: true, title: true, date: true, price: true, hotels: { select: { id: true, name: true, price: true } } },
      });
      if (!tour) return NextResponse.json({ error: 'تور یافت نشد' }, { status: 404 });

      // اگر تور هتل دارد، انتخاب هتل الزامی است و باید از هتل‌های همین تور باشد
      let hotel: { id: string; name: string; price: number } | null = null;
      if (tour.hotels.length > 0) {
        hotel = tour.hotels.find((h) => h.id === hotelId) || null;
        if (!hotel) return NextResponse.json({ error: 'لطفاً هتل را انتخاب کنید' }, { status: 400 });
      }

      // 💰 مبلغ نهایی فقط سمت سرور: (قیمت تور + قیمت هتل) × تعداد نفرات (تومان)
      const tourPrice = Number(toEnglishDigits(String(tour.price ?? '')).replace(/\D/g, '')) || 0;
      const unitPrice = tourPrice + (hotel ? Math.round(hotel.price) : 0);
      const amount = unitPrice * seats;

      // جلوگیری از ثبت تکراری یک کد ملی برای یک تور
      const duplicate = await prisma.passenger.findFirst({
        where: { leaderId: leader.id, nationalId, tourId: tour.id },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'این کد ملی قبلاً برای این تور ثبت شده است' }, { status: 409 });
      }

      const baseTourLabel = `${tour.title || tour.name || 'تور'}${tour.date ? ` (${tour.date})` : ''}`;
      const tourName = hotel ? `${baseTourLabel} - هتل ${hotel.name}` : baseTourLabel;

   const created = await prisma.passenger.create({
      data: {
        fullName,
        mobile,
        nationalId,
        birthDate,
        tourName,
        tourId: tour.id,
        seatsCount: seats,
        paymentStatus: 'در انتظار تایید فیش',
        insurance: false,
        receiptDate: new Date().toLocaleDateString('fa-IR'),
        amount: String(amount),
        receiptImage,
        tenantId: leader.id,
        leaderId: leader.id,
      },
      select: { id: true },
    });

      // اطلاعات شخصی مسافر به مرورگر برگردانده نمی‌شود
      return NextResponse.json({ success: true, id: created.id });
    }

    // ───────────────────────────────────────────────────────────────
    // مسیر ۲: ثبت دستی مسافر توسط خود لیدر (از پنل لیدر)
    // ───────────────────────────────────────────────────────────────
    const auth = await requireActiveLeader();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const { fullName, mobile, phone, nationalId, tourName, paymentStatus, insurance, receiptDate, amount, receiptImage } = body;
    const mobileValue = mobile || phone;

    const seatsValue = Math.min(Math.max(Math.floor(Number(body.seatsCount || body.seats) || 1), 1), MAX_SEATS);
    const leaderId = auth.leader.id;

    const newPassenger = await prisma.passenger.create({
      data: { 
        fullName: cleanStr(fullName, 80) || 'بدون نام', 
        mobile: cleanStr(mobileValue, 20),
        nationalId: cleanStr(nationalId, 20), 
        tourName: cleanStr(tourName, 200) || 'تور عمومی', 
        seatsCount: seatsValue, 
        paymentStatus: cleanStr(paymentStatus, 40) || 'ثبت شده توسط لیدر', 
        insurance: Boolean(insurance), 
        receiptDate: cleanStr(receiptDate, 20) || new Date().toLocaleDateString('fa-IR'), 
        amount: amount ? cleanStr(amount, 20) : '0', 
        receiptImage: cleanImageUrl(receiptImage),
        tenantId: leaderId,
        leader: {
          connect: { id: leaderId }
        }
      }
    });

    const responseData = {
      ...(newPassenger as any),
      phone: (newPassenger as any).phone || (newPassenger as any).mobile,
      mobile: (newPassenger as any).mobile || (newPassenger as any).phone
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Passenger creation error details:', error);
    return NextResponse.json({ error: 'Failed to create passenger' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireActiveLeader();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }
    const leaderId = auth.leader.id;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'درخواست نامعتبر است' }, { status: 400 });
    }

    const { id, fullName, mobile, phone, nationalId, tourName, paymentStatus, insurance, receiptDate, amount, receiptImage } = body;
    const mobileValue = mobile || phone;

    const seatsValue = body.seatsCount !== undefined || body.seats !== undefined 
      ? Math.min(Math.max(Math.floor(Number(body.seatsCount || body.seats) || 1), 1), MAX_SEATS)
      : undefined;

    if (!id) {
      return NextResponse.json({ error: 'Passenger ID required' }, { status: 400 });
    }

    // 🔒 بررسی مالکیت: مسافر باید متعلق به همین لیدر باشد (جلوگیری از IDOR)
    const existing = await prisma.passenger.findFirst({
      where: { id: String(id), leaderId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'مسافر یافت نشد' }, { status: 404 });
    }

    const updated = await prisma.passenger.update({
      where: { id: existing.id },
      data: {
        ...(fullName !== undefined && { fullName: cleanStr(fullName, 80) }),
        ...(mobileValue !== undefined && { mobile: cleanStr(mobileValue, 20) }),
        ...(nationalId !== undefined && { nationalId: cleanStr(nationalId, 20) }),
        ...(tourName !== undefined && { tourName: cleanStr(tourName, 200) }),
        ...(seatsValue !== undefined && { seatsCount: seatsValue }),
        ...(paymentStatus !== undefined && { paymentStatus: cleanStr(paymentStatus, 40) }),
        ...(insurance !== undefined && { insurance: Boolean(insurance) }),
        ...(receiptDate !== undefined && { receiptDate: cleanStr(receiptDate, 20) }),
        ...(amount !== undefined && amount !== null && amount !== '' && String(amount) !== '0' && String(amount) !== 'NaN' && { amount: cleanStr(amount, 20) }),
        ...(receiptImage !== undefined && { receiptImage: cleanImageUrl(receiptImage) })
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Detailed Passenger Update Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireActiveLeader();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');
    const leaderId = auth.leader.id;

    // اگر درخواست حذف همه بود (فقط مسافران همین لیدر)
    if (all === 'true') {
      await prisma.passenger.deleteMany({
        where: { leaderId }
      });

      return NextResponse.json({ success: true, message: 'All records deleted successfully' });
    }

    // حذف تکی مسافر
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // 🔒 حذف فقط اگر مسافر متعلق به همین لیدر باشد
    const result = await prisma.passenger.deleteMany({ where: { id: String(id), leaderId } });
    if (result.count === 0) {
      return NextResponse.json({ error: 'مسافر یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete passenger error:', error);
    return NextResponse.json({ error: 'Failed to delete passenger' }, { status: 500 });
  }
}