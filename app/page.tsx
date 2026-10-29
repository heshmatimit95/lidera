import { prisma } from './lib/db';
import TourForm from './components/TourForm';
export default async function Page({ 
  searchParams 
}: { 
  searchParams: Promise<{ slug?: string; leader?: string }> 
}) {
  const resolvedParams = await searchParams;
  const slug = resolvedParams.slug || resolvedParams.leader || 'leader_1';

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
  // این خط رو پاک کن:
// phone: true,
    zarinpalMerchantId: true,
    tours: {
      select: {
        id: true,
        title: true,
        price: true,
        date: true,
      }
    } 
  },
});

  if (!leader) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', color: '#ff4d4d', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>
        <h2>❌ لیدر یا تور مورد نظر یافت نشد.</h2>
      </div>
    );
  }

 return <TourForm leader={leader} />;
}