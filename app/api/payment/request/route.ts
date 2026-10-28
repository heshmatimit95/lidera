import { prisma } from '../../../lib/db';
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amountInRial, description, leaderId } = body;
    
    // تعریف pData برای استفاده در سراسر تابع
    const pData = body.passengerData || {};

    const fPhone = pData.phone || pData.mobile || pData.phoneNumber || '';
    const fNationalId = pData.nationalId || pData.national_id || pData.codeMelli || '';
    const fTourName = description || body.tourName || pData.tourName || 'تور گردشگری';

    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: leaderId }, { slug: leaderId }] },
    });

    if (!leader) {
      return NextResponse.json({ success: false, message: 'لیدر مورد نظر یافت نشد' }, { status: 404 });
    }

    const merchant =
      leader?.zarinpalMerchantId ||
      process.env.ZARINPAL_MERCHANT ||
      "00000000-0000-0000-0000-000000000000";

    const callbackUrl = `https://lidera.ir/api/payment/verify?leaderId=${leaderId}&fullName=${encodeURIComponent(pData.fullName || '')}&phone=${fPhone}&nationalId=${fNationalId}&tourName=${encodeURIComponent(fTourName)}&amount=${amountInRial}`;

    const response = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/request.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchant,
        amount: amountInRial,
        callback_url: callbackUrl,
        description: description || `رزرو تور ${fTourName}`,
        metadata: { mobile: fPhone, email: pData.email || '' }
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