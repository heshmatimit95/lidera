import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { requireActiveLeader } from '../../../lib/auth';
import { checkRateLimit } from '../../../lib/rate-limit';

// ذخیره‌ی ظرفیت و هزینه‌های مالی هر تور؛ فقط لیدرِ مالکِ همان تور (فعال و واردشده) به آن دسترسی دارد.

const MAX_MONEY = 100_000_000_000; // ۱۰۰ میلیارد تومان
const MAX_CAP = 100_000;

const clampInt = (v: unknown, max: number) => {
  const n = Math.floor(Number(String(v ?? '').replace(/[^0-9]/g, '')));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
};

export async function GET(request: Request) {
  try {
    const auth = await requireActiveLeader();
    if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });
    

    const tourId = new URL(request.url).searchParams.get('tourId') || '';
    if (!tourId || tourId.length > 100) return NextResponse.json({ message: 'شناسه‌ی تور نامعتبر است' }, { status: 400 });

    // شرط leaderId جلوی دسترسی به تورِ دیگران (IDOR) را می‌گیرد
    const tour = await prisma.tour.findFirst({
      where: { id: tourId, leaderId: auth.leader.id },
      select: { finance: true },
    });
    if (!tour) return NextResponse.json({ message: 'تور یافت نشد' }, { status: 404 });

    const f: any = tour.finance && typeof tour.finance === 'object' ? tour.finance : {};
    return NextResponse.json(
      { capacity: clampInt(f.capacity, MAX_CAP), fixedCost: clampInt(f.fixedCost, MAX_MONEY), perPerson: clampInt(f.perPerson, MAX_MONEY) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
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

    const finance = {
      capacity: clampInt(body?.capacity, MAX_CAP),
      fixedCost: clampInt(body?.fixedCost, MAX_MONEY),
      perPerson: clampInt(body?.perPerson, MAX_MONEY),
    };

    const r = await prisma.tour.updateMany({
      where: { id: tourId, leaderId: auth.leader.id },
      data: { finance },
    });
    if (r.count === 0) return NextResponse.json({ message: 'تور یافت نشد' }, { status: 404 });

    return NextResponse.json({ ok: true, ...finance });
  } catch (e) {
    console.error('finance PUT error:', e);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}