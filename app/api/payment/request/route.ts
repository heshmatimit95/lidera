import { prisma } from '../../../lib/db';
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // چاپ کل بدنه ارسالی در ترمینال برای اطمینان خاطر
    console.log("=== FRONTEND PAYLOAD ===", JSON.stringify(body, null, 2));

    // ۱. استخراج هوشمند مبلغ (پشتیبانی از تمام کلیدهای احتمالی)
    const rawAmount = body.amountInRial || body.amount || body.price || body.totalAmount || body.cost || body.fee || 0;
    const amountInRial = Number(rawAmount);

    const leaderId = body.leaderId || body.leader_id || body.slug || '';
    if (!amountInRial || !leaderId) {
      return NextResponse.json({ success: false, message: 'اطلاعات ناقص است (مبلغ یا لیدر نامعتبر)' }, { status: 400 });
    }

    // ۲. استخراج هوشمند اطلاعات مسافر (پشتیبانی از تمام حالت‌های ممکن در بدنه یا آبجکت‌های داخلی)
    const pData = body.passengerData || body.passenger || body.user || body.formData || body;

    const fName = pData.fullName || pData.name || pData.passengerName || pData.passenger_name || pData.fullNameFa || pData['نام'] || pData['نام و نام خانوادگی'] || '';
    const fPhone = pData.phone || pData.mobile || pData.phoneNumber || pData.phone_number || pData['تلفن'] || pData['شماره تماس'] || body.phone || body.mobile || '';
    const fNationalId = pData.nationalId || pData.national_id || pData.codeMelli || pData.nationalCode || pData['کد ملی'] || body.nationalId || '';
    
    // عنوان تور
    const description = body.description || body.tourName || pData.tourName || pData.tourTitle || '';
    const fTourName = description || 'تور گردشگری';

    // ۳. پیدا کردن لیدر در دیتابیس
    const leader = await prisma.leader.findFirst({
      where: {
        OR: [{ id: leaderId }, { slug: leaderId }],
      },
    });

    const merchant = leader?.zarinpalMerchantId || process.env.ZARINPAL_MERCHANT || '00000000-0000-0000-0000-000000000000';
    const callbackUrl = `https://lidera.ir/api/payment/verify?leaderId=${leaderId}`;

    // ۴. ارسال درخواست به درگاه زرین‌پال
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
      
      // ۵. ذخیره امن و کامل تمام اطلاعات در کوکی
      const resNext = NextResponse.json({ success: true, url: paymentUrl });
      resNext.cookies.set({
        name: 'pending_passenger_data',
        value: JSON.stringify({
          fullName: fName,
          phone: fPhone,
          nationalId: fNationalId,
          tourName: fTourName,
          amountInRial: amountInRial
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 600
      });

      return resNext;
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