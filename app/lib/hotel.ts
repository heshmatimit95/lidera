import { prisma } from './db';

// هتل انتخاب‌شده باید متعلق به همان تور باشد (جلوگیری از دست‌کاری قیمت توسط کلاینت)
export async function resolveHotel(tourId: unknown, hotelId: unknown) {
  const tId = String(tourId ?? '').trim().slice(0, 64);
  const hId = String(hotelId ?? '').trim().slice(0, 64);
  if (!tId || !hId) return null;
  return await prisma.hotel.findFirst({
    where: { id: hId, tourId: tId },
    select: { id: true, name: true, price: true },
  });
}