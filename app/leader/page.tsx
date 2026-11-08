import { prisma } from '../lib/db';
import LeaderDashboard from './LeaderDashboard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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
    where: { OR: [{ slug }, { id: slug }] },
    select: {
      id: true,
      slug: true,
      name: true,
      fullName: true,
      mobile: true,
      zarinpalMerchantId: true,
      paymentMethod: true,
      cards: true,
      mustChangePassword: true, // 👈 این خط را اینجا اضافه کن
      status: true,
tours: { 
  select: { 
    id: true, 
    name: true, 
    title: true, 
    price: true, 
    date: true,
    images: true,
    image1: true,
    image2: true,
    image3: true,
    image4: true,
    tourImages: { select: { url: true } } // واکشی از جدول رابطه TourImage
    
  } 
}
    }
  });


  
if (!leader) {
    return (
      <div className="min-h-screen bg-[#F9704E] text-white flex items-center justify-center font-bold text-lg" dir="rtl">
        لیدر مورد نظر یافت نشد
      </div>
    );
  }

  // 👈 این چک را اینجا بگذار (بعد از اینکه مطمئن شدیم لیدر وجود دارد)
  if (leader.status === 'BLOCKED' || leader.status === 'PENDING') {
    redirect('/login-leader?error=blocked');
  }

  // خواندن مسافران مستقیماً از دیتابیس
const passengers = await prisma.passenger.findMany({
    where: { leaderId: leader.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      fullName: true,
      mobile: true,
      nationalId: true,
      tourName: true,
      paymentStatus: true,
      insurance: true,
      receiptDate: true,
      amount: true,
      seatsCount: true,
      receiptImage: true,
      createdAt: true

      
    }
  });

 // (این بخش را بعد از پیدا کردن leader در کد قرار بده)
const token = (await cookies()).get('leader_token')?.value;
let ok = false;
try {
  const { payload } = await jwtVerify(token ?? '', new TextEncoder().encode(process.env.JWT_SECRET!));
  ok = payload.role === 'leader' && payload.leaderId === leader.id;
} catch {}

if (!ok) redirect(`/login?slug=${encodeURIComponent(slug)}`);

  return <LeaderDashboard initialLeader={leader} initialPassengers={passengers} />;
}