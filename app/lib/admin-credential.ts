import { prisma } from '../../app/lib/db';

// هش رمز ادمین: اول از دیتابیس (بعد از تغییر رمز از پنل)، در غیر این صورت از ADMIN_PASSWORD_HASH در env
export async function getAdminHash(): Promise<string> {
  try {
    const row = await prisma.adminCredential.findUnique({
      where: { id: 'admin' },
      select: { passwordHash: true },
    });
    if (row?.passwordHash) return row.passwordHash;
  } catch {
    // جدول هنوز ساخته نشده → از متغیر محیطی استفاده می‌شود
  }
  return process.env.ADMIN_PASSWORD_HASH ?? '';
}
