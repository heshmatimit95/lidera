import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json([], { status: 400 });

  const leader = await prisma.leader.findFirst({
    where: { OR: [{ id: tenantId }, { slug: tenantId }] }
  });

  if (!leader) return NextResponse.json([], { status: 404 });

  const tours = await prisma.tour.findMany({ 
    where: { leaderId: leader.id }, 
    orderBy: { createdAt: 'desc' } 
  });
  
  return NextResponse.json(tours);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, name, title, date, price, images } = body;

    // پیدا کردن لیدر بر اساس id یا slug ارسالی
    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: tenantId }, { slug: tenantId }] }
    });

    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    const newTour = await prisma.tour.create({
      data: {
        name: name || title || 'تور بدون عنوان',
        title: title || name || 'تور بدون عنوان',
        date: date ? String(date) : null,
        price: price ? String(price) : null,
        images: images || [],
        tenantId: leader.id,
        leader: {
          connect: { id: leader.id }
        }
      }
    });

    return NextResponse.json(newTour);
  } catch (error) {
    console.error('Error creating tour:', error);
    return NextResponse.json({ error: 'Failed to create tour' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, title, date, price, images } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Tour ID required' }, { status: 400 });
    }

    const updated = await prisma.tour.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date: String(date) }),
        ...(price !== undefined && { price: String(price) }),
        ...(images !== undefined && { images })
      }
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating tour:', error);
    return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  try {
    await prisma.tour.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tour:', error);
    return NextResponse.json({ error: 'Failed to delete tour' }, { status: 500 });
  }
}