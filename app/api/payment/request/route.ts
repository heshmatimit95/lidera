import { prisma } from '../../../lib/db';
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { amountInRial, description, leaderId, passengerData } = await req.json();

    if (!amountInRial || !leaderId || !passengerData) {
      return NextResponse.json({ success: false, message: 'اطلاعات ناقص است' }, { status: 400 });
    }

    // پیدا کردن لیدر بر اساس slug یا id
    const leader = await prisma.leader.findFirst({
      where: {
        OR: [{ id: leaderId }, { slug: leaderId }],
      },
    });
// استخراج امن اطلاعات مسافر
    const fName = passengerData?.fullName || passengerData?.name || '';
    const fPhone = passengerData?.phone || passengerData?.mobile || '';
    const fNationalId = passengerData?.nationalId || '';
    const fTourName = passengerData?.tourName || 'تور گردشگری';
    // استفاده از مرچنت اختصاصی لیدر یا مرچنت سندباکس پیش‌فرض
    const merchant = leader?.zarinpalMerchantId || process.env.ZARINPAL_MERCHANT || '00000000-0000-0000-0000-000000000000';

    // آدرس بازگشت به سایت روی دامنه اصلی lidera.ir همراه با شناسه اختصاصی لیدر
    // آدرس بازگشت کامل همراه با تمام پارامترهای واقعی مسافر، تور و مبلغ
   const callbackUrl = `https://lidera.ir/api/payment/verify?leaderId=${leaderId}&fullName=${encodeURIComponent(fName)}&phone=${fPhone}&nationalId=${fNationalId}&tourName=${encodeURIComponent(fTourName)}&amount=${amountInRial}`;
    // ارسال درخواست به درگاه زرین‌پال (محیط سندباکس)
    const response = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/request.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchant,
        amount: Number(amountInRial), // مبلغ به ریال
        callback_url: callbackUrl,
        description: description || `رزرو تور لیدرا`,
        metadata: {
          mobile: passengerData.phone || '',
          email: passengerData.email || ''
        }
      })
    });

    const data = await response.json();

    if (data.data && data.data.code === 100) {
      // آدرس StartPay برای محیط سندباکس تنظیم شد
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