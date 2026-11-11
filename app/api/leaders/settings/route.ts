import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { requireActiveLeader } from '../../../lib/auth'; // 👈 تابع امنیتی کلود
import { checkRateLimit } from '../../../lib/rate-limit';

const ALLOWED_PAYMENT_METHODS = ['card', 'gateway', 'both'];
const MAX_CARDS = 4;

const toEnglishDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
   .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const cleanStr = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export async function POST(request: Request) {
  try {
    // 👈 بررسی امنیتی: لیدر باید لاگین کرده باشد و حسابش فعال و مسدود نباشد
    const auth = await requireActiveLeader();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    // از آیدی خودِ لیدر احراز هویت شده استفاده می‌شود تا امنیت کامل برقرار باشد
    const leaderId = auth.leader.id;

    const rl = checkRateLimit(`settings:${leaderId}`, 20, 60_000);
    if (!rl.success) {
      return NextResponse.json({ success: false, message: 'تعداد درخواست‌ها زیاد است.' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'درخواست نامعتبر است' }, { status: 400 });
    }
    const { paymentMethod, cards } = body;

    // ── اعتبارسنجی روش پرداخت ──
    if (paymentMethod !== undefined && !ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ success: false, message: 'نوع پرداخت نامعتبر است' }, { status: 400 });
    }

    // ── اعتبارسنجی کارت‌ها (فقط اگر ارسال شده باشند) ──
    let cleanedCards: { cardNumber: string; bankName: string; cardHolder: string }[] | null = null;
    if (cards !== undefined) {
      if (!Array.isArray(cards) || cards.length > MAX_CARDS) {
        return NextResponse.json({ success: false, message: `حداکثر ${MAX_CARDS} کارت مجاز است` }, { status: 400 });
      }
      cleanedCards = [];
      for (const card of cards) {
        const cardNumber = toEnglishDigits(String(card?.cardNumber ?? card?.number ?? '')).replace(/\D/g, '');
        if (!cardNumber) continue; // ردیف خالی نادیده گرفته می‌شود
        if (cardNumber.length !== 16) {
          return NextResponse.json({ success: false, message: 'شماره کارت باید ۱۶ رقم باشد' }, { status: 400 });
        }
        cleanedCards.push({
          cardNumber,
          bankName: cleanStr(card?.bankName ?? card?.bank, 40),
          cardHolder: cleanStr(card?.cardHolder ?? card?.holder, 60),
        });
      }
    }

    // استفاده از Transaction برای آپدیت روش پرداخت و مدیریت کارت‌ها
    await prisma.$transaction(async (tx) => {
      // ۱. آپدیت روش پرداخت لیدر (فقط اگر ارسال شده)
      if (paymentMethod !== undefined) {
        await tx.leader.update({
          where: { id: leaderId },
          data: { paymentMethod }
        });
      }

      // ۲ و ۳. فقط اگر لیست کارت‌ها ارسال شده، کارت‌های قبلی جایگزین می‌شوند
      // (قبلاً با ارسال فقط paymentMethod همه‌ی کارت‌ها پاک می‌شد)
      if (cleanedCards !== null) {
        await tx.bankCard.deleteMany({ where: { leaderId } });
        if (cleanedCards.length > 0) {
          await tx.bankCard.createMany({
            data: cleanedCards.map((c) => ({ ...c, leaderId })),
          });
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}