import { prisma } from '../../../lib/db';
import { NextResponse, NextRequest } from "next/server";
import { checkRateLimit } from '../../../lib/rate-limit';

const SITE_URL = (process.env.SITE_URL || 'https://lidera.ir').replace(/\/$/, '');
const IS_SANDBOX = process.env.ZARINPAL_SANDBOX !== 'false';
const ZP_HOST = IS_SANDBOX ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com';
const STATUS_PAID = 'پرداخت شده آنلاین';

const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';

// تماس با زرین‌پال با مهلت ۱۰ ثانیه
async function zarinpalPost(path: string, payload: object) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(`${ZP_HOST}/pg/v4/payment/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
      cache: 'no-store',
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// آدرس بازگشت همیشه روی دامنه‌ی خودمان است (بدون Open Redirect)
const goBack = (slug: string | null, result: 'success' | 'canceled' | 'failed' | 'error') =>
  NextResponse.redirect(
    `${SITE_URL}/?${slug ? `slug=${encodeURIComponent(slug)}&` : ''}payment=${result}`
  );

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const authority = (url.searchParams.get("Authority") || '').trim().slice(0, 64);
  const status = url.searchParams.get("Status");

  // 🔒 فقط Authority خوانده می‌شود؛ مبلغ، مسافر و لیدر از دیتابیس می‌آیند نه از آدرس
  const rl = checkRateLimit(`payverify:${clientIp(request)}`, 30, 60_000);
  if (!rl.success) return goBack(null, 'error');

  if (!/^[A-Za-z0-9]{10,64}$/.test(authority)) return goBack(null, 'error');

  try {
    const passenger = await prisma.passenger.findUnique({
      where: { paymentAuthority: authority },
      select: {
        id: true,
        amount: true,
        paymentStatus: true,
        leader: { select: { slug: true, zarinpalMerchantId: true } },
      },
    });

    if (!passenger) return goBack(null, 'error');
    const slug = passenger.leader.slug;

    // پرداخت لغو شد
    if (status !== "OK") return goBack(slug, 'canceled');

    // اگر قبلاً تأیید شده، دوباره به زرین‌پال درخواست نمی‌دهیم (idempotent)
    if (passenger.paymentStatus === STATUS_PAID) return goBack(slug, 'success');

    const merchant =
      passenger.leader.zarinpalMerchantId ||
      process.env.ZARINPAL_MERCHANT ||
      (IS_SANDBOX ? '00000000-0000-0000-0000-000000000000' : '');
    if (!merchant) return goBack(slug, 'error');

    // مبلغ فقط از دیتابیس (تومان × ۱۰ = ریال)
    const amountRial = Math.round(Number(passenger.amount) * 10);
    if (!Number.isFinite(amountRial) || amountRial < 10_000) return goBack(slug, 'error');

    const data = await zarinpalPost('verify.json', {
      merchant_id: merchant,
      amount: amountRial,
      authority,
    });

    const code = data?.data?.code;
    if (code === 100 || code === 101) {
      // به‌روزرسانی اتمیک: فقط اگر هنوز پرداخت‌شده نیست؛ و خطا دیگر بلعیده نمی‌شود
      await prisma.passenger.updateMany({
        where: { id: passenger.id, paymentStatus: { not: STATUS_PAID } },
        data: {
          paymentStatus: STATUS_PAID,
          paymentRefId: data?.data?.ref_id != null ? String(data.data.ref_id) : null,
          receiptDate: new Date().toLocaleDateString('fa-IR'),
        },
      });
      return goBack(slug, 'success');
    }

    return goBack(slug, 'failed');
  } catch (error) {
    console.error("Verification Error:", error);
    return goBack(null, 'error');
  }
}