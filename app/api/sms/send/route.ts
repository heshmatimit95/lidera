import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { mobile, type, passengerName, tourName, reason } = await req.json();

    if (!mobile) {
      return NextResponse.json({ error: 'شماره موبایل الزامی است' }, { status: 400 });
    }

    // متن پیامک بر اساس نوع وضعیت
    let text = '';
    if (type === 'APPROVED') {
      text = `سلام ${passengerName} عزیز🌸\nفیش واریزی شما برای تور «${tourName}» تایید شد.\nثبت‌نام شما نهایی گردید.\n— پلتفرم لیدرا`;
    } else if (type === 'REJECTED') {
      text = `سلام ${passengerName} عزیز\nفیش واریزی شما برای تور «${tourName}» تایید نشد.\nعلت: ${reason || 'عدم تطابق مبلغ یا تصویر'}\nلطفاً جهت اصلاح اقدام کنید.\n— پلتفرم لیدرا`;
    }

    // 🔴 در این قسمت API سرویس پیامک خود را فراخوانی می‌کنید
    // به عنوان نمونه (Console Log برای تست محلی):
    console.log(`[SMS Sent to ${mobile}]:\n${text}`);

    return NextResponse.json({ success: true, message: 'پیامک با موفقیت ارسال شد' });
  } catch (error) {
    console.error('SMS Error:', error);
    return NextResponse.json({ error: 'خطا در ارسال پیامک' }, { status: 500 });
  }
}