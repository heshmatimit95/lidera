import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const p = await prisma.passenger.findUnique({
      where: { id },
      select: { receiptImage: true },
    });

    return NextResponse.json({ receiptImage: p?.receiptImage ?? null });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت عکس' }, { status: 500 });
  }
}