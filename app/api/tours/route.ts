import { prisma } from '../../lib/db';
import { NextResponse, NextRequest } from "next/server";
import { requireActiveLeader } from '../../lib/auth';

// GET: دریافت لیست تورها (عمومی برای نمایش به مسافران و لیدر)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json([], { status: 400 });

  const leader = await prisma.leader.findFirst({
    where: { OR: [{ id: tenantId }, { slug: tenantId }] },
    select: { id: true, status: true } // 👈 فقط فیلدهای لازم برای امنیت و کارایی
  });

  // بررسی مسدود نبودن لیدر در نمایش عمومی
  if (!leader || leader.status !== 'ACTIVE') return NextResponse.json([], { status: 404 });

  const tours = await prisma.tour.findMany({ 
    where: { leaderId: leader.id }, 
    orderBy: { createdAt: 'desc' } 
  });
  
  return NextResponse.json(tours);
}

// POST: ایجاد تور جدید (با بررسی مالکیت قطعی از روی توکن)
export async function POST(request: NextRequest) {
  try {
    const leaderAuth = await requireActiveLeader();
    if (!leaderAuth.ok) {
      return NextResponse.json({ success: false, error: leaderAuth.message }, { status: leaderAuth.status });
    }

    const body = await request.json();
    const { name, title, date, price, images } = body;

    // 🔒 نکته حیاتی امنیتی (جلوگیری از IDOR): شناسه لیدر اجباراً از توکن خوانده می‌شود نه از بدنه درخواست!
    const verifiedLeaderId = leaderAuth.leader.id;

    const newTour = await prisma.tour.create({
      data: {
        name: name || title || 'تور بدون عنوان',
        title: title || name || 'تور بدون عنوان',
        date: date ? String(date) : null,
        price: price ? String(price) : null,
        images: images || [],
        tenantId: verifiedLeaderId,
        leader: {
          connect: { id: verifiedLeaderId }
        }
      }
    });

    return NextResponse.json(newTour);
  } catch (error) {
    console.error('Error creating tour:', error);
    return NextResponse.json({ error: 'Failed to create tour' }, { status: 500 });
  }
}

// PUT: ویرایش تور (با بررسی مالکیت: لیدر فقط تور خودش را می‌تواند ویرایش کند)
export async function PUT(request: NextRequest) {
  try {
    const leaderAuth = await requireActiveLeader();
    if (!leaderAuth.ok) {
      return NextResponse.json({ success: false, error: leaderAuth.message }, { status: leaderAuth.status });
    }

    const body = await request.json();
    const { id, name, title, date, price, images } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Tour ID required' }, { status: 400 });
    }

    // 🔒 بررسی مالکیت تور: اول چک می‌کنیم آیا این تور واقعاً متعلق به همین لیدر است؟
    const existingTour = await prisma.tour.findFirst({
      where: { id: id, leaderId: leaderAuth.leader.id }
    });

    if (!existingTour) {
      return NextResponse.json({ error: 'تور یافت نشد یا شما دسترسی ندارید' }, { status: 403 });
    }

    const updated = await prisma.tour.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date: String(date) }),
        ...(price !== undefined && { price: String(price) }),
        ...(images !== undefined && { images })
      }
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating tour:', error);
    return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 });
  }
}

// DELETE: حذف تور (با بررسی مالکیت: لیدر فقط تور خودش را می‌تواند حذف کند)
export async function DELETE(request: NextRequest) {
  try {
    const leaderAuth = await requireActiveLeader();
    if (!leaderAuth.ok) {
      return NextResponse.json({ success: false, error: leaderAuth.message }, { status: leaderAuth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // 🔒 بررسی مالکیت تور پیش از حذف
    const existingTour = await prisma.tour.findFirst({
      where: { id: id, leaderId: leaderAuth.leader.id }
    });

    if (!existingTour) {
      return NextResponse.json({ error: 'تور یافت نشد یا شما دسترسی ندارید' }, { status: 403 });
    }

    await prisma.tour.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tour:', error);
    return NextResponse.json({ error: 'Failed to delete tour' }, { status: 400 });
  }
}