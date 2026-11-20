import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { requireActiveLeader } from '@/app/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // فقط لیدرِ واردشده و فقط برای مسافرانِ خودش (فیش واریزی اطلاعات خصوصی است)
    const auth = await requireActiveLeader();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { id } = await params;
    const p = await prisma.passenger.findFirst({
      where: { id, leaderId: auth.leader.id },
      select: { receiptImage: true },
    });

    return NextResponse.json({ receiptImage: p?.receiptImage ?? null });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت عکس' }, { status: 500 });
  }
}
