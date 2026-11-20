import { prisma } from '../lib/db';
import LeaderDashboard from './LeaderDashboard';
import ForcePasswordGate from './ForcePasswordGate';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isActive } from '../lib/leader-status';

import { jwtVerify } from 'jose';
export default async function Page({ searchParams }: { searchParams: Promise<{ slug?: string }> }) {
  const { slug } = await searchParams;
  
  if (!slug) {
    return (
      <div className="min-h-screen bg-[#F9704E] text-white flex items-center justify-center font-bold text-lg" dir="rtl">
        اسلاگ لیدر در آدرس صفحه یافت نشد
      </div>
    );
  }

const leader = await prisma.leader.findFirst({
  where: {
    OR: [
      { slug: slug },
      { id: slug }
    ]
  },
  select: {
    id: true,
    slug: true,
    name: true,
    fullName: true,
      paymentMethod: true,
      cards: true,
      status: true,
      mustChangePassword: true, // 👈 بدون این فیلد، مودال اجبار تغییر رمز هرگز باز نمی‌شد
 tours: {
  orderBy: { createdAt: 'desc' },
  select: {
    id: true,
    name: true,
    title: true,
    price: true,
    date: true,
    duration: true,
    startDate: true,
    endDate: true,
    services: true,
    transportType: true,
    transports: true,
    images: true,
    image1: true,
    image2: true,
    image3: true,
    image4: true,
    tourImages: { select: { url: true } },
    hotels: {
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
      },
    },
  },
},
  }
});
 
if (!leader) {
    return (
      <div className="min-h-screen bg-[#F9704E] text-white flex items-center justify-center font-bold text-lg" dir="rtl">
        لیدر مورد نظر یافت نشد
      </div>
    );
  }

 // (این بخش را بعد از پیدا کردن leader در کد قرار بده)
const token = (await cookies()).get('leader_token')?.value;
let ok = false;
try {
  const { payload } = await jwtVerify(token ?? '', new TextEncoder().encode(process.env.JWT_SECRET!));
  ok = payload.role === 'leader' && payload.leaderId === leader.id;
} catch {}

if (!ok) redirect(`/login?slug=${encodeURIComponent(slug)}`);
if (!isActive(leader.status)) redirect(`/login?slug=${encodeURIComponent(slug)}&blocked=1`);

// اجبار واقعی تغییر رمز: تا رمز عوض نشود، هیچ داده‌ای (تور، مسافر، ...) به مرورگر فرستاده نمی‌شود
if (leader.mustChangePassword) {
  return <ForcePasswordGate slug={leader.slug} />;
}

  // خواندن مسافران مستقیماً از دیتابیس (بعد از احراز هویت)
const passengers = await prisma.passenger.findMany({
    where: { leaderId: leader.id },
    orderBy: { createdAt: 'desc' },
    take: 2000,
    select: {
      id: true,
      fullName: true,
      mobile: true,
      nationalId: true,
      birthDate: true,
      tourName: true,
      tourId: true,
      hotelId: true,
      hotelName: true,
      hotelPrice: true,
      transportId: true,
      transportPrice: true,
      transportName: true,
     paymentStatus: true,
      insurance: true,
      receiptDate: true,
      amount: true,
      seatsCount: true,
      receiptImage: true,
      createdAt: true
    }
  });

  return <LeaderDashboard initialLeader={leader} initialPassengers={passengers} />;
}