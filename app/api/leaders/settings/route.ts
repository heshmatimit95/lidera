import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, paymentMethod, cards } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    // اول لیدر را پیدا کنیم تا ID اصلی‌اش را داشته باشیم (چونکه ممکن است tenantId همان slug باشد)
    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: tenantId }, { slug: tenantId }] }
    });

    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    // استفاده از Transaction برای آپدیت روش پرداخت و مدیریت کارت‌ها
    await prisma.$transaction(async (tx) => {
      // ۱. آپدیت روش پرداخت لیدر
      await tx.leader.update({
        where: { id: leader.id },
        data: { paymentMethod: paymentMethod }
      });

      // ۲. حذف کارت‌های قبلی این لیدر
      await tx.bankCard.deleteMany({
        where: { leaderId: leader.id }
      });

      // ۳. اگر کارتی ارسال شده بود، جدیدها را اضافه کن
      if (cards && Array.isArray(cards) && cards.length > 0) {
        await tx.bankCard.createMany({
          data: cards.map((card: any) => ({
            cardNumber: card.cardNumber || card.number || '',
            bankName: card.bankName || card.bank || '',
            cardHolder: card.cardHolder || card.holder || '',
            leaderId: leader.id
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