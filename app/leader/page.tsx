import { prisma } from '../lib/db';
import LeaderDashboard from './LeaderDashboard';

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
    image4: true
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

 

  return <LeaderDashboard initialLeader={leader} initialPassengers={passengers} />;
}