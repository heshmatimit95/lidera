import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { isActive } from '../../../lib/leader-status';
import { checkRateLimit } from '../../../lib/rate-limit';

// ظرفیت باقی‌مانده‌ی تورها برای فرم عمومی مسافر.
// فقط تورهایی که لیدر «ظرفیت» گذاشته برمی‌گردند و فقط سه عدد: capacity، taken، remaining.
// هیچ داده‌ی مالی یا مشخصات مسافر در پاسخ نیست.

const toEn = (s: unknown) =>
  String(s ?? '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
const seatsOf = (v: unknown) => {
  const d = toEn(v).replace(/[^0-9]/g, '');
  const n = d ? Number(d) : 0;
  return n > 0 ? Math.min(n, 100) : 1;
};
const isRejected = (s?: string | null) => {
  const v = String(s || '');
  return v.includes('مغایرت') || v.includes('فیش رد') || v === 'رد شده';
};
const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';

export async function GET(request: Request) {
  try {
    const rl = checkRateLimit(`capacity:${clientIp(request)}`, 60, 60_000);
    if (!rl.success) return NextResponse.json({ tours: [] }, { status: 429 });

    const slug = (new URL(request.url).searchParams.get('slug') || '').trim().slice(0, 64);
    if (!slug) return NextResponse.json({ tours: [] }, { status: 400 });

    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: slug }, { slug }] },
      select: { id: true, status: true },
    });
    if (!leader || !isActive(leader.status)) return NextResponse.json({ tours: [] }, { status: 404 });

    const tours = await prisma.tour.findMany({
      where: { leaderId: leader.id },
      select: { id: true, name: true,  finance: true },
      take: 100,
    });

    const withCap = tours
      .map((t) => {
        const f: any = t. finance && typeof t. finance === 'object' ? t. finance : {};
        const capacity = Math.floor(Number(f.capacity) || 0);
        return { id: t.id, name: t.name, capacity };
      })
      .filter((t) => t.capacity > 0);

    if (withCap.length === 0) {
      return NextResponse.json({ tours: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const rows = await prisma.passenger.findMany({
      where: {
        leaderId: leader.id,
        OR: [
          { tourId: { in: withCap.map((t) => t.id) } },
          { tourId: null },
        ],
      },
      select: { tourId: true, tourName: true, seatsCount: true, paymentStatus: true },
      take: 20000,
    });

    const taken = new Map<string, number>();
    for (const r of rows) {
      if (isRejected(r.paymentStatus)) continue;
      let id = r.tourId || '';
      if (!id) {
        // مسافران قدیمی بدون tourId: با نام تور تطبیق داده می‌شوند
        const nm = String(r.tourName || '');
        const hit = withCap.find((t) => t.name && nm.startsWith(String(t.name).trim()));
        if (!hit) continue;
        id = hit.id;
      }
      taken.set(id, (taken.get(id) || 0) + seatsOf(r.seatsCount));
    }

    return NextResponse.json(
      {
        tours: withCap.map((t) => {
          const tk = taken.get(t.id) || 0;
          return { id: t.id, capacity: t.capacity, taken: tk, remaining: Math.max(0, t.capacity - tk) };
        }),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    console.error('capacity GET error:', e);
    return NextResponse.json({ tours: [] }, { status: 500 });
  }
}