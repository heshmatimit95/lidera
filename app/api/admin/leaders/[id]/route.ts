import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { requireAdmin } from '@/app/lib/require-admin'; // 👈 تابع امنیتی ادمین

const ALLOWED_STATUSES = ['pending', 'active', 'blocked'];
const USERNAME_RE = /^[a-z0-9_]{3,32}$/;

const cleanStr = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

const stripPassword = (leader: any) => {
  const { password, ...rest } = leader;
  return rest;
};

const unauthorized = () => NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });

// DELETE: حذف لیدر بر اساس ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 👈 بررسی امنیتی: فقط ادمین اجازه حذف لیدر را دارد
    try { await requireAdmin(); } catch { return unauthorized(); }

    const resolvedParams = await params;
    const id = cleanStr(resolvedParams.id, 64);

    if (!id) {
      return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 });
    }

    await prisma.leader.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'لیدر با موفقیت حذف شد' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting leader:', error);
    return NextResponse.json({ error: 'خطا در حذف رکورد از دیتابیس' }, { status: 500 });
  }
}

// PATCH: آپدیت وضعیت یا اطلاعات لیدر (فقط فیلدهای مجاز؛ رمز از این مسیر تغییر نمی‌کند)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 👈 بررسی امنیتی: فقط ادمین اجازه ویرایش وضعیت/اطلاعات لیدر را دارد
    try { await requireAdmin(); } catch { return unauthorized(); }

    const resolvedParams = await params;
    const id = cleanStr(resolvedParams.id, 64);
    const body = await request.json().catch(() => null);

    if (!id) {
      return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 });
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'درخواست نامعتبر است' }, { status: 400 });
    }

    const current = await prisma.leader.findUnique({
      where: { id },
      select: { id: true, blockedAt: true },
    });
    if (!current) {
      return NextResponse.json({ error: 'لیدر یافت نشد' }, { status: 404 });
    }

    // فقط فیلدهای مجاز (قبلاً کل body مستقیم در دیتابیس نوشته می‌شد)
    const data: Record<string, unknown> = {};
    if (body.fullName !== undefined) data.fullName = cleanStr(body.fullName, 120);
    if (body.name !== undefined) data.name = cleanStr(body.name, 60);
    if (body.lastName !== undefined) data.lastName = cleanStr(body.lastName, 60);
    if (body.username !== undefined) {
      const u = cleanStr(body.username, 32).toLowerCase();
      if (!USERNAME_RE.test(u)) {
        return NextResponse.json({ error: 'نام کاربری نامعتبر است' }, { status: 400 });
      }
      data.username = u;
    }
    if (body.mobile !== undefined) data.mobile = cleanStr(body.mobile, 20) || null;
    if (body.nationalId !== undefined) data.nationalId = cleanStr(body.nationalId, 20) || null;
    if (body.address !== undefined) data.address = cleanStr(body.address, 300) || null;
    if (body.instagram !== undefined) data.instagram = cleanStr(body.instagram, 60) || null;
    if (body.telegram !== undefined) data.telegram = cleanStr(body.telegram, 60) || null;
    if (body.whatsapp !== undefined) data.whatsapp = cleanStr(body.whatsapp, 20) || null;
    if (body.rubika !== undefined) data.rubika = cleanStr(body.rubika, 60) || null;
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!ALLOWED_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'وضعیت نامعتبر است' }, { status: 400 });
      }
      data.status = status;
      data.blockedAt = status === 'blocked' ? (current.blockedAt ?? new Date()) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'فیلد قابل ویرایشی ارسال نشد' }, { status: 400 });
    }

    const updatedLeader = await prisma.leader.update({
      where: { id: id },
      data,
    });

    return NextResponse.json(stripPassword(updatedLeader), { status: 200 });
  } catch (error) {
    console.error('Error updating leader:', error);
    return NextResponse.json({ error: 'خطا در ویرایش اطلاعات لیدر' }, { status: 500 });
  }
}