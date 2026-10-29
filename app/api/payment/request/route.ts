import { prisma } from '../../../lib/db';
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amountInRial, description, leaderId } = body;
    const pData = body.passengerData || {};

    // استخراج هوشمند و چندکلیدی اطلاعات مسافر از فرانت‌اند
    const fFullName = pData.fullName || body.fullName || pData.name || body.name || 'مسافر گرامی';
    const fPhone = pData.phone || pData.mobile || body.phone || body.mobile || pData.phoneNumber || '09120000000';
    const fNationalId = pData.nationalId || body.nationalId || pData.codeMelli || body.codeMelli || '0000000000';
    const fTourName = description || pData.tourName || body.tourName || 'تور گردشگری';

    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: leaderId }, { slug: leaderId }] },
    });

    if (!leader) {
      return NextResponse.json({ success: false, message: 'لیدر یافت نشد' }, { status: 404 });
    }

    // ۱. ثبت اولیه مسافر با اطلاعات کاملاً واقعی وارد شده در فرم
    const amountInToman = Math.floor(amountInRial / 10);
    const newPassenger = await prisma.passenger.create({
      data: {
        fullName: fFullName,
        mobile: fPhone,
        nationalId: fNationalId,
        tourName: fTourName,
        paymentStatus: "در انتظار پرداخت",
        amount: `${amountInToman.toLocaleString('fa-IR')} تومان`,
        receiptDate: new Date().toLocaleDateString('fa-IR'),
        leaderId: leader.id,
        tenantId: leader.id,
      },
    });

    const merchant =
      leader?.zarinpalMerchantId ||
      process.env.ZARINPAL_MERCHANT ||
      "00000000-0000-0000-0000-000000000000";

    const callbackUrl = `https://lidera.ir/api/payment/verify?leaderId=${leaderId}&passengerId=${newPassenger.id}&amount=${amountInRial}`;

    const response = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/request.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchant,
        amount: amountInRial,
        callback_url: callbackUrl,
        description: `رزرو تور ${fTourName}`,
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