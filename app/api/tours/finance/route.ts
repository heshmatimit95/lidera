import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { requireActiveLeader } from '../../../lib/auth';
import { checkRateLimit } from '../../../lib/rate-limit';

// ذخیره‌ی ظرفیت و هزینه‌های هر تور (در ستون transfer از جدول Tour)؛
// فقط لیدرِ مالکِ همان تور (فعال و واردشده) به آن دسترسی دارد.

const MAX_MONEY = 100_000_000_000; // ۱۰۰ میلیارد تومان
const MAX_CAP = 100_000;

const clampInt = (v: unknown, max: number) => {
  const n = Math.floor(Number(String(v ?? '').replace(/[^0-9]/g, '')));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
};
// درصد با یک رقم اعشار (۰ تا ۵۰)
const clampPct = (v: unknown) => {
  const n = Number(String(v ?? '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(50, Math.round(n * 10) / 10);
};

const shape = (f: any) => ({
  capacity: clampInt(f?.capacity, MAX_CAP),
  fixedCost: clampInt(f?.fixedCost, MAX_MONEY),
  perPerson: clampInt(f?.perPerson, MAX_MONEY),
  feePct: clampPct(f?.feePct),
  reservePct: clampPct(f?.reservePct),
});

export async function GET(request: Request) {
  try {
    const auth = await requireActiveLeader();
    if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

    const tourId = new URL(request.url).searchParams.get('tourId') || '';
    if (!tourId || tourId.length > 100) return NextResponse.json({ message: 'شناسه‌ی تور نامعتبر است' }, { status: 400 });

    // شرط leaderId جلوی دسترسی به تورِ دیگران (IDOR) را می‌گیرد
    const tour = await prisma.tour.findFirst({
      where: { id: tourId, leaderId: auth.leader.id },
      select: { transfer: true },
    });
    if (!tour) return NextResponse.json({ message: 'تور یافت نشد' }, { status: 404 });

    const f: any = tour.transfer && typeof tour.transfer === 'object' ? tour.transfer : {};
    return NextResponse.json(shape(f), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('finance GET error:', e);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireActiveLeader();
    if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

    const rl = checkRateLimit(`finance:${auth.leader.id}`, 60, 60_000);
    if (!rl.success) return NextResponse.json({ message: 'درخواست زیاد است. کمی بعد امتحان کنید.' }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const tourId = String(body?.tourId ?? '');
    if (!tourId || tourId.length > 100) return NextResponse.json({ message: 'شناسه‌ی تور نامعتبر است' }, { status: 400 });

    // فقط کلیدهای ارسال‌شده عوض می‌شوند؛ بقیه (مثلاً هزینه‌ها) دست‌نخورده می‌مانند
    const existing = await prisma.tour.findFirst({
      where: { id: tourId, leaderId: auth.leader.id },
      select: { transfer: true },
    });
    if (!existing) return NextResponse.json({ message: 'تور یافت نشد' }, { status: 404 });
    const prev: any = existing.transfer && typeof existing.transfer === 'object' ? existing.transfer : {};
    const merged: any = { ...prev };
    for (const key of ['capacity', 'fixedCost', 'perPerson', 'feePct', 'reservePct']) {
      if (body && Object.prototype.hasOwnProperty.call(body, key)) merged[key] = body[key];
    }
    const finance = shape(merged);

    const r = await prisma.tour.updateMany({
      where: { id: tourId, leaderId: auth.leader.id },
      data: { transfer: finance },
    });
    if (r.count === 0) return NextResponse.json({ message: 'تور یافت نشد' }, { status: 404 });

    return NextResponse.json({ ok: true, ...finance });
  } catch (e) {
    console.error('finance PUT error:', e);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}