import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireActiveLeader } from '../../lib/auth'; // 👈 تابع امنیتی کلود

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantKey = searchParams.get('tenantId') || searchParams.get('slug') || searchParams.get('leaderId');
    
    // خواندن شماره صفحه برای صفحه‌بندی (پیش‌فرض صفحه ۱)
    const page = Number(searchParams.get('page')) || 1;

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
    const auth = await requireActiveLeader();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const body = await request.json();
    console.log("Received POST body:", body);

    const { fullName, mobile, phone, nationalId, tourName, paymentStatus, insurance, receiptDate, amount, receiptImage } = body;
    const mobileValue = mobile || phone;

    const seatsValue = Number(body.seatsCount || body.seats || 1);
    const leaderId = auth.leader.id;

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
    return NextResponse.json({ error: error.message || 'Failed to create passenger' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireActiveLeader();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

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
        ...(amount !== undefined && amount !== null && amount !== '' && String(amount) !== '0' && String(amount) !== 'NaN' && { amount: String(amount) }),
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
    const auth = await requireActiveLeader();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');
    const leaderId = auth.leader.id;

    // اگر درخواست حذف همه بود
    if (all === 'true') {
      await prisma.passenger.deleteMany({
        where: { tenantId: leaderId }
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