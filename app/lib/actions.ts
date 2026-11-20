'use server';

import { prisma } from './db';
import { hashNationalId } from './leader-utils';
import { hashPassword } from './password'; // اصلاح نام تابع

export async function fastRegisterLeader(mobile: string, nationalId: string) {
  const hashedId = hashNationalId(nationalId);
  
  // هش کردن پسورد پیش‌فرض برای اینکه در لاگین دچار خطای 401 نشود
const securePassword = await hashPassword("default_password_123");

  return await prisma.leader.create({
    data: {
      fullName: `تورلیدر ${mobile.slice(-4)}`,
      username: `leader_${mobile}`, 
      slug: `leader-${nationalId}`,
      mobile: mobile,
      nationalId: hashedId,
      status: 'PENDING',
      password: securePassword, // استفاده از پسورد هش‌شده
    },
  });
}