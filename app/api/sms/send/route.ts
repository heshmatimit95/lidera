import { NextResponse } from 'next/server';
import { requireActiveLeader } from '@/app/lib/auth';
import { checkRateLimit } from '@/app/lib/rate-limit';

const clean = (v: unknown, max: number) =>
  String(v ?? '').replace(/[\r\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

const toEnglishDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
   .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

export async function POST(req: Request) {
  try {
    // فقط لیدر واردشده می‌تواند پیامک بفرستد (قبلاً هر کسی از بیرون می‌توانست)
    const auth = await requireActiveLeader();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    // سقف ارسال برای جلوگیری از سوءاستفاده و هزینه‌ی پیامک
    const rl = checkRateLimit(`sms:${auth.leader.id}`, 30, 10 * 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: 'تعداد ارسال پیامک زیاد است. کمی بعد تلاش کنید.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const mobile = toEnglishDigits(clean(body.mobile, 20)).replace(/[\s-]/g, '');
    const type = clean(body.type, 20);
    const passengerName = clean(body.passengerName, 80);
    const tourName = clean(body.tourName, 120);
    const reason = clean(body.reason, 200);

    if (!mobile) {
      return NextResponse.json({ error: 'شماره موبایل الزامی است' }, { status: 400 });
    }
    if (!/^(09\d{9}|\+989\d{9}|9\d{9})$/.test(mobile)) {
      return NextResponse.json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });
    }

    // متن پیامک بر اساس نوع وضعیت
    let text = '';
    if (type === 'APPROVED') {
      text = `سلام ${passengerName} عزیز🌸\nفیش واریزی شما برای تور «${tourName}» تایید شد.\nثبت‌نام شما نهایی گردید.\n— پلتفرم لیدرا`;
    } else if (type === 'REJECTED') {
      text = `سلام ${passengerName} عزیز\nفیش واریزی شما برای تور «${tourName}» تایید نشد.\nعلت: ${reason || 'عدم تطابق مبلغ یا تصویر'}\nلطفاً جهت اصلاح اقدام کنید.\n— پلتفرم لیدرا`;
    } else {
      return NextResponse.json({ error: 'نوع پیامک نامعتبر است' }, { status: 400 });
    }

    // 🔴 در این قسمت API سرویس پیامک خود را فراخوانی می‌کنید
    // به عنوان نمونه (Console Log برای تست محلی؛ شماره در لاگ کامل چاپ نمی‌شود):
    console.log(`[SMS Sent to ${mobile.slice(0, 4)}***${mobile.slice(-2)}]:\n${text}`);

    return NextResponse.json({ success: true, message: 'پیامک با موفقیت ارسال شد' });
  } catch (error) {
    console.error('SMS Error:', error);
    return NextResponse.json({ error: 'خطا در ارسال پیامک' }, { status: 500 });
  }
}
