import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireActiveLeader } from '../../../lib/auth'; // 👈 تابع امنیتی کلود

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // 👈 بررسی امنیتی: لیدر باید لاگین کرده باشد و حسابش فعال و مسدود نباشد
    const auth = await requireActiveLeader();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const body = await request.json();
    const { paymentMethod, cards } = body;

    // از آیدی خودِ لیدر احراز هویت شده استفاده می‌شود تا امنیت کامل برقرار باشد
    const leaderId = auth.leader.id;

    // استفاده از Transaction برای آپدیت روش پرداخت و مدیریت کارت‌ها
    await prisma.$transaction(async (tx) => {
      // ۱. آپدیت روش پرداخت لیدر
      await tx.leader.update({
        where: { id: leaderId },
        data: { paymentMethod: paymentMethod }
      });

      // ۲. حذف کارت‌های قبلی این لیدر
      await tx.bankCard.deleteMany({
        where: { leaderId: leaderId }
      });

      // ۳. اگر کارتی ارسال شده بود، جدیدها را اضافه کن
      if (cards && Array.isArray(cards) && cards.length > 0) {
        await tx.bankCard.createMany({
          data: cards.map((card: any) => ({
            cardNumber: card.cardNumber || card.number || '',
            bankName: card.bankName || card.bank || '',
            cardHolder: card.cardHolder || card.holder || '',
            leaderId: leaderId
          }))
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}