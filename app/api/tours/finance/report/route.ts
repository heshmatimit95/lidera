import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { requireActiveLeader } from '../../../../lib/auth';
import { checkRateLimit } from '../../../../lib/rate-limit';

// گزارش مالی سمت سرور: فقط ستون‌های لازم خوانده و همین‌جا جمع زده می‌شود؛
// مرورگر فقط عدد نهایی را می‌گیرد. فقط لیدرِ فعال و فقط داده‌ی خودش.

const MAX_ROWS = 20000;
const MAX_SPAN_DAYS = 800;
const DAY = 86400000;

const toEn = (s: unknown) =>
  String(s ?? '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
const num = (v: unknown) => {
  const d = toEn(v).replace(/[^0-9]/g, '');
  return d ? Number(d) : 0;
};

type Kind = 'paid' | 'deposit' | 'receipt' | 'waiting' | 'rejected';
const kindOf = (s?: string | null): Kind => {
  const v = String(s || '');
  if (v === 'پرداخت شده') return 'paid';
  if (v === 'بیعانه') return 'deposit';
  if (v.includes('مغایرت') || v.includes('فیش رد') || v === 'رد شده') return 'rejected';
  if (v.includes('تایید فیش')) return 'receipt';
  return 'waiting';
};

const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }); // YYYY-MM-DD به وقت تهران

export async function GET(request: Request) {
  try {
    const auth = await requireActiveLeader();
    if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

    const rl = checkRateLimit(`finreport:${auth.leader.id}`, 90, 60_000);
    if (!rl.success) return NextResponse.json({ message: 'درخواست زیاد است. کمی بعد امتحان کنید.' }, { status: 429 });

    const sp = new URL(request.url).searchParams;
    const tourId = sp.get('tourId') || '';
    const fromRaw = sp.get('from');
    const toRaw = sp.get('to');

    const where: any = { leaderId: auth.leader.id };

    if (fromRaw || toRaw) {
      const from = new Date(fromRaw || '');
      const to = new Date(toRaw || '');
      if (isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from) {
        return NextResponse.json({ message: 'بازه‌ی زمانی نامعتبر است' }, { status: 400 });
      }
      if ((to.getTime() - from.getTime()) / DAY > MAX_SPAN_DAYS) {
        return NextResponse.json({ message: 'بازه‌ی زمانی بیش از حد بزرگ است' }, { status: 400 });
      }
      where.createdAt = { gte: from, lt: to };
    }

    if (tourId) {
      if (tourId.length > 100) return NextResponse.json({ message: 'شناسه‌ی تور نامعتبر است' }, { status: 400 });
      // شرط leaderId جلوی دسترسی به تورِ دیگران را می‌گیرد
      const tour = await prisma.tour.findFirst({
        where: { id: tourId, leaderId: auth.leader.id },
        select: { id: true, name: true },
      });
      if (!tour) return NextResponse.json({ message: 'تور یافت نشد' }, { status: 404 });
      // مسافران قدیمی که tourId ندارند با نام تور تطبیق داده می‌شوند
      where.OR = [
        { tourId: tour.id },
        ...(tour.name ? [{ tourId: null, tourName: { startsWith: String(tour.name).trim() } }] : []),
      ];
    }

    const rows = await prisma.passenger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: MAX_ROWS + 1,
      select: { paymentStatus: true, amount: true, seatsCount: true, hotelName: true, transportName: true, createdAt: true, tourId: true, tourName: true },
    });
    const truncated = rows.length > MAX_ROWS;
    if (truncated) rows.pop();

    const t = {
      regs: 0, seats: 0, revenue: 0,
      paid: 0, deposit: 0, receipt: 0, waiting: 0, rejected: 0,
      rejectedCount: 0, receiptCount: 0, depositCount: 0, staleCount: 0,
    };
    const hotels: Record<string, { seats: number; revenue: number }> = {};
    const transports: Record<string, { seats: number; revenue: number }> = {};
    const days: Record<string, number> = {};
    const now = Date.now();

    // حالت مقایسه‌ی تورها (فقط وقتی تور مشخص نشده): گروه‌بندی بر اساس تور
    const wantCompare = !tourId && sp.get('compare') === '1';
    const tourList = wantCompare
      ? await prisma.tour.findMany({ where: { leaderId: auth.leader.id }, select: { id: true, name: true } })
      : [];
    const nameToId = (n: string) => {
      const x = String(n || '').trim();
      const hit = tourList.find((t) => t.name && x.startsWith(String(t.name).trim()));
      return hit ? hit.id : '';
    };
    const cmp: Record<string, { id: string; name: string; regs: number; seats: number; revenue: number; paid: number }> = {};

    for (const r of rows) {
      const k = kindOf(r.paymentStatus);
      const amount = num(r.amount);
      const seats = Math.max(1, Number(r.seatsCount) || 1);
      if (k === 'rejected') {
        t.rejected += amount;
        t.rejectedCount += 1;
        continue;
      }
      t.regs += 1;
      t.seats += seats;
      t.revenue += amount;
      if (k === 'paid') t.paid += amount;
      if (k === 'deposit') { t.deposit += amount; t.depositCount += 1; }
      if (k === 'receipt') { t.receipt += amount; t.receiptCount += 1; }
      if (k === 'waiting') t.waiting += amount;
      if ((k === 'waiting' || k === 'receipt') && now - r.createdAt.getTime() > 3 * DAY) t.staleCount += 1;

      if (wantCompare) {
        const id = r.tourId || nameToId(r.tourName) || `x:${String(r.tourName || '').slice(0, 60)}`;
        const nm = tourList.find((x) => x.id === id)?.name || r.tourName || 'بدون تور';
        (cmp[id] ||= { id, name: String(nm).slice(0, 80), regs: 0, seats: 0, revenue: 0, paid: 0 });
        cmp[id].regs += 1; cmp[id].seats += seats; cmp[id].revenue += amount;
        if (k === 'paid') cmp[id].paid += amount;
      }

      const h = String(r.hotelName || 'بدون هتل').slice(0, 80);
      const tr = String(r.transportName || 'بدون انتخاب حمل‌ونقل').slice(0, 80);
      (hotels[h] ||= { seats: 0, revenue: 0 });
      hotels[h].seats += seats; hotels[h].revenue += amount;
      (transports[tr] ||= { seats: 0, revenue: 0 });
      transports[tr].seats += seats; transports[tr].revenue += amount;

      const dk = dayKey.format(r.createdAt);
      days[dk] = (days[dk] || 0) + 1;
    }

    const compare = wantCompare ? Object.values(cmp).sort((x, y) => y.revenue - x.revenue) : undefined;
    return NextResponse.json({ totals: t, hotels, transports, days, truncated, compare }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('finance report error:', e);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}