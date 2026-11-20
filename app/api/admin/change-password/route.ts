import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/db';
import { requireAdmin } from '../../../lib/require-admin';
import { checkRateLimit } from '../../../lib/rate-limit';
import { getAdminHash } from '../../../lib/admin-credential';

function validateStrongPassword(password: string) {
  if (password.length < 8) return 'رمز عبور باید حداقل ۸ کاراکتر باشد.';
  if (password.length > 72) return 'رمز عبور حداکثر می‌تواند ۷۲ کاراکتر باشد.';
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) return 'رمز عبور باید شامل حروف بزرگ و کوچک انگلیسی باشد.';
  if (!/\d/.test(password)) return 'رمز عبور باید حداقل یک عدد داشته باشد.';
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password)) return 'رمز عبور باید حداقل یک علامت خاص (مثل @ # $ !) داشته باشد.';
  return null;
}

export async function PUT(request: Request) {
  try {
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ message: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const rl = checkRateLimit('admin-chpw', 5, 15 * 60_000);
    if (!rl.success) {
      return NextResponse.json({ message: 'تلاش بیش از حد. بعداً امتحان کنید.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const currentPassword = String(body.currentPassword ?? '').slice(0, 200);
    const newPassword = String(body.newPassword ?? '');

    const err = validateStrongPassword(newPassword);
    if (err) return NextResponse.json({ message: err }, { status: 400 });

    if (newPassword === currentPassword) {
      return NextResponse.json({ message: 'رمز جدید باید با رمز فعلی فرق داشته باشد' }, { status: 400 });
    }

    const hash = await getAdminHash();
    if (!hash || !(await bcrypt.compare(currentPassword, hash))) {
      return NextResponse.json({ message: 'رمز فعلی اشتباه است' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.adminCredential.upsert({
      where: { id: 'admin' },
      update: { passwordHash },
      create: { id: 'admin', passwordHash },
    });

    return NextResponse.json({ message: 'رمز عبور مدیریت با موفقیت تغییر کرد' }, { status: 200 });
  } catch (error) {
    console.error('Admin change password error:', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
