'use server';

import { prisma } from './db';
import { hashNationalId } from './leader-utils';

export async function fastRegisterLeader(mobile: string, nationalId: string) {
  const hashedId = hashNationalId(nationalId);

  return await prisma.leader.create({
    data: {
      fullName: `تورلیدر ${mobile.slice(-4)}`,
      username: `leader_${mobile}`, // <--- اضافه کردن یوزرنیم پیش‌فرض
      slug: `leader-${nationalId}`,
      mobile: mobile,
      nationalId: hashedId,
      status: 'PENDING',
      password: "default_password_123",
    },
  });
}