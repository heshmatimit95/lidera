import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantKey = searchParams.get('tenantId') || searchParams.get('slug') || searchParams.get('leaderId');
    
    if (!tenantKey) {
      const allPassengers = await prisma.passenger.findMany({ orderBy: { createdAt: 'desc' } });
      const mapped = allPassengers.map((p: any) => ({
        ...p,
        phone: p.phone || p.mobile,
        mobile: p.mobile || p.phone
      }));
      return NextResponse.json(mapped);
    }

    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: tenantKey }, { slug: tenantKey }, { username: tenantKey }] }
    });

    if (!leader) return NextResponse.json([], { status: 404 });

    const passengers = await prisma.passenger.findMany({ 
      where: { 
        OR: [
          { leaderId: leader.id },
          { tenantId: leader.id },
          { tenantId: leader.slug }
        ]
      }, 
      orderBy: { createdAt: 'desc' } 
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
    const body = await request.json();
    console.log("Received POST body:", body);

    const tenantKey = body.tenantId || body.leaderId || body.slug;
    
    const { fullName, mobile, phone, nationalId, tourName, paymentStatus, insurance, receiptDate, amount, receiptImage } = body;
    const mobileValue = mobile || phone;

    // در ثبت‌نام جدید، اگر کاربر صندلی انتخاب کرده باشد خوانده می‌شود، وگرنه پیش‌فرض ۱ است
    const seatsValue = Number(body.seatsCount || body.seats || 1);

    if (!tenantKey) {
      return NextResponse.json({ error: 'Tenant or Leader ID required' }, { status: 400 });
    }

    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: tenantKey }, { slug: tenantKey }, { username: tenantKey }] }
    });

    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    const newPassenger = await prisma.passenger.create({
      data: { 
        fullName: fullName || 'بدون نام', 
        mobile: mobileValue || '',
        nationalId: nationalId || '', 
        tourName: tourName || 'تور عمومی', 
        seatsCount: seatsValue, 
        paymentStatus: paymentStatus || 'ثبت شده توسط لیدر', 
        insurance: Boolean(insurance), 
        receiptDate: receiptDate || new Date().toLocaleDateString('fa-IR'), 
        amount: amount ? String(amount) : '0', 
        receiptImage: receiptImage || null,
        tenantId: leader.id,
        leader: {
          connect: { id: leader.id }
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
    return NextResponse.json({ error: error.message || 'Failed to create passenger' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("Received PUT body:", body);

    const { id, fullName, mobile, phone, nationalId, tourName, paymentStatus, insurance, receiptDate, amount, receiptImage } = body;
    const mobileValue = mobile || phone;

    const seatsValue = body.seatsCount !== undefined || body.seats !== undefined 
      ? Number(body.seatsCount || body.seats) 
      : undefined;

    if (!id) {
      return NextResponse.json({ error: 'Passenger ID required' }, { status: 400 });
    }

const updated = await prisma.passenger.update({
      where: { id: String(id) },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(mobileValue !== undefined && { mobile: mobileValue }),
        ...(nationalId !== undefined && { nationalId }),
        ...(tourName !== undefined && { tourName }),
        ...(seatsValue !== undefined && { seatsCount: seatsValue }),
        ...(paymentStatus !== undefined && { paymentStatus }),
        ...(insurance !== undefined && { insurance: Boolean(insurance) }),
        ...(receiptDate !== undefined && { receiptDate: receiptDate || '' }),
        amount: amount !== undefined && amount !== null && amount !== '' ? String(amount) : '0',
        ...(receiptImage !== undefined && { receiptImage })
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Detailed Passenger Update Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tenantKey = searchParams.get('tenantId') || searchParams.get('slug');
    const all = searchParams.get('all');

    // اگر درخواست حذف همه بود
    if (all === 'true') {
      if (!tenantKey) {
        return NextResponse.json({ error: 'Tenant ID required for delete all' }, { status: 400 });
      }

      // پیدا کردن لیدر برای پوشش دادن هم ID و هم Slug
      const leader = await prisma.leader.findFirst({
        where: { OR: [{ id: tenantKey }, { slug: tenantKey }, { username: tenantKey }] }
      });

      // حذف تمام مسافرانی که به این لیدر مرتبط هستند (چه با tenantId و چه با leaderId)
      await prisma.passenger.deleteMany({
        where: {
          OR: [
            { tenantId: tenantKey },
            ...(leader ? [{ tenantId: leader.id }, { tenantId: leader.slug }] : [])
          ]
        }
      });

      return NextResponse.json({ success: true, message: 'All records deleted successfully' });
    }

    // حذف تکی مسافر
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await prisma.passenger.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete passenger error:', error);
    return NextResponse.json({ error: 'Failed to delete passenger' }, { status: 500 });
  }
}