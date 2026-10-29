import { prisma } from '../../../lib/db';
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amountInRial, description, leaderId } = body;
    const pData = body.passengerData || {};

    const fFullName = (pData.fullName || body.fullName || '').trim();
    const fPhone = (pData.phone || pData.mobile || body.phone || body.mobile || '').trim();
    const fNationalId = (pData.nationalId || body.nationalId || '').trim();
    const fTourName = description || pData.tourName || body.tourName || 'تور گردشگری';
    
    // دریافت دقیق تعداد صندلی
    const fSeatsCount = Number(pData.seatsCount || body.seatsCount || 1);

    if (!fFullName || !fPhone || !fNationalId) {
      return NextResponse.json({ 
        success: false, 
        message: 'اطلاعات مسافر ناقص است' 
      }, { status: 400 });
    }

    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: leaderId }, { slug: leaderId }] },
    });

    if (!leader) {
      return NextResponse.json({ success: false, message: 'لیدر یافت نشد' }, { status: 404 });
    }

    const amountInToman = Math.floor(amountInRial / 10);
    
    // ثبت رکورد مسافر با پوشش کامل نام فیلدهای صندلی و مبلغ عددی
    const newPassenger = await prisma.passenger.create({
      data: {
        fullName: fFullName,
        mobile: fPhone,
        nationalId: fNationalId,
        tourName: fTourName,
        paymentStatus: "در انتظار پرداخت",
        amount: String(amountInToman), // ذخیره مبلغ به صورت عدد متنی برای هماهنگی با پنل
        seatsCount: fSeatsCount,
        seats: fSeatsCount,
        receiptDate: new Date().toLocaleDateString('fa-IR'),
        leaderId: leader.id,
        tenantId: leader.id,
      } as any,
    });

    const merchant =
      leader?.zarinpalMerchantId ||
      process.env.ZARINPAL_MERCHANT ||
      "00000000-0000-0000-0000-000000000000";

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lidera.ir';
    const callbackUrl = `${baseUrl}/api/payment/verify?leaderId=${leader.id}&passengerId=${newPassenger.id}&amount=${amountInRial}`;

    const response = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/request.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchant,
        amount: amountInRial,
        callback_url: callbackUrl,
        description: `رزرو تور ${fTourName} (${fSeatsCount} نفر)`,
        metadata: { mobile: fPhone }
      })
    });

    const data = await response.json();

    if (data.data && data.data.code === 100) {
      return NextResponse.json({
        success: true,
        url: `https://sandbox.zarinpal.com/pg/StartPay/${data.data.authority}`
      });
    } else {
      await prisma.passenger.update({
        where: { id: newPassenger.id },
        data: { paymentStatus: 'ناموفق' },
      }).catch(() => {});

      return NextResponse.json({
        success: false,
        message: data.errors?.message || 'خطا در ارتباط با زرین‌پال'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment Request Error:', error);
    return NextResponse.json({ success: false, message: 'خطای داخلی سرور' }, { status: 500 });
  }
}