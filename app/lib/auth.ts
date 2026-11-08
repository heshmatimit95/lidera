import { prisma } from './db'; // یا مسیر صحیح فایل پرایزما در پروژه شما

export async function getActiveLeader(leaderId: string) {
  const leader = await prisma.leader.findUnique({
    where: { id: leaderId },
    select: { id: true, status: true },
  });
  
  if (!leader || leader.status !== 'ACTIVE') return null;
  return leader;
}
