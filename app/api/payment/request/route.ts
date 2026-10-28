import { prisma } from '../../../lib/db';
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // ۱. استخراج هوشمند مبلغ (از کلیدهای مختلف فرانت‌اند)
    const rawAmount = body.amountInRial || body.amount || body.price || body.totalAmount || 0;
    const amountInRial = Number(rawAmount);

    const leaderId = body.leaderId || body.leader_id || body.slug || '';
    if (!amountInRial || !leaderId) {
      return NextResponse.json({ success: false, message: 'اطلاعات ناقص است' }, { status: 400 });
    }

    // ۲. استخراج هوشمند اطلاعات مسافر از تمام لایه‌های ممکن JSON
    const pData = body.passengerData || body.passenger || body.user || body;

    const fName = pData.fullName || pData.name || pData.passengerName || pData.passenger_name || pData.fullNameFa || '';
    const fPhone = pData.phone || pData.mobile || pData.phoneNumber || pData.phone_number || body.phone || body.mobile || '';
    const fNationalId = pData.nationalId || pData.national_id || pData.codeMelli || pData.nationalCode || body.nationalId || '';
    
    // عنوان تور
    const description = body.description || '';
    const fTourName = pData.tourName || pData.tour_name || pData.tourTitle || description || 'تور گردشگری';

    // ۳. پیدا کردن لیدر
    const leader = await prisma.leader.findFirst({
      where: {
        OR: [{ id: leaderId }, { slug: leaderId }],
      },
    });

    const merchant = leader?.zarinpalMerchantId || process.env.ZARINPAL_MERCHANT || '00000000-0000-0000-0000-000000000000';

    // ۴. ساخت callbackUrl کامل و بدون نقص
    const callbackUrl = `https://lidera.ir/api/payment/verify?leaderId=${leaderId}&fullName=${encodeURIComponent(fName)}&phone=${fPhone}&nationalId=${fNationalId}&tourName=${encodeURIComponent(fTourName)}&amount=${amountInRial}`;

    // ۵. ارسال درخواست به درگاه زرین‌پال
    const response = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/request.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchant,
        amount: amountInRial,
        callback_url: callbackUrl,
        description: description || `رزرو تور ${fTourName}`,
        metadata: {
          mobile: fPhone,
          email: pData.email || '',
        }
      })
    });

    const data = await response.json();

    if (data.data && data.data.code === 100) {
      const paymentUrl = `https://sandbox.zarinpal.com/pg/StartPay/${data.data.authority}`;
      return NextResponse.json({ success: true, url: paymentUrl });
    } else {
      return NextResponse.json({
        success: false,
        message: 'خطا در ایجاد درگاه پرداخت',
        details: data.errors
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Payment Request Error:', error);
    return NextResponse.json({ success: false, message: 'خطای سرور' }, { status: 500 });
  }
}