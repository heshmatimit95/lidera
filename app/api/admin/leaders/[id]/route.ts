import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE: حذف لیدر بر اساس ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 });
    }

    await prisma.leader.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'لیدر با موفقیت حذف شد' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting leader:', error);
    return NextResponse.json({ error: 'خطا در حذف رکورد از دیتابیس' }, { status: 500 });
  }
}

// PATCH: آپدیت وضعیت یا اطلاعات لیدر
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 });
    }

    const updatedLeader = await prisma.leader.update({
      where: { id: id },
      data: body,
    });

    return NextResponse.json(updatedLeader, { status: 200 });
  } catch (error) {
    console.error('Error updating leader:', error);
    return NextResponse.json({ error: 'خطا در ویرایش اطلاعات لیدر' }, { status: 500 });
  }
}