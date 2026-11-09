import { prisma } from './db'; // یا مسیر صحیح فایل پرایزما در پروژه شما
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { isActive } from './leader-status';
export async function getActiveLeader(leaderId: string) {
  const leader = await prisma.leader.findUnique({
    where: { id: leaderId },
    select: { id: true, status: true },
  });
  
  if (!leader || leader.status !== 'ACTIVE') return null;
  return leader;
}

export type LeaderAuthResult =
  | { ok: true; leader: { id: string; slug: string; status: string | null; mustChangePassword: boolean } }
  | { ok: false; status: 401 | 403; message: string };

export async function requireActiveLeader(
  options: { allowMustChange?: boolean } = {}
): Promise<LeaderAuthResult> {
  const token = (await cookies()).get('leader_token')?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return { ok: false, status: 401, message: 'ابتدا وارد شوید' };

  let leaderId: string;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.role !== 'leader' || typeof payload.leaderId !== 'string') throw new Error();
    leaderId = payload.leaderId;
  } catch {
    return { ok: false, status: 401, message: 'ابتدا وارد شوید' };
  }

  // وضعیت همیشه از دیتابیس خوانده می‌شود، نه از توکن
  const leader = await prisma.leader.findUnique({
    where: { id: leaderId },
    select: { id: true, slug: true, status: true, mustChangePassword: true },
  });

  if (!leader) return { ok: false, status: 401, message: 'ابتدا وارد شوید' };
  if (!isActive(leader.status)) {
    return { ok: false, status: 403, message: 'دسترسی شما موقتاً مسدود است' };
  }
  if (leader.mustChangePassword && !options.allowMustChange) {
    return { ok: false, status: 403, message: 'ابتدا رمز عبور را تغییر دهید' };
  }
  return { ok: true, leader };
}