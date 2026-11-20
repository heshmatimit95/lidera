'use server';

import { hashPassword, generatePassword } from '../lib/password';
import { requireAdmin } from '../lib/require-admin';
import { requireActiveLeader } from '../lib/auth';
import { isActive } from '../lib/leader-status';
import { checkRateLimit } from '../lib/rate-limit';
import { prisma } from '../lib/db';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';

// ─── ابزارهای کمکی (خصوصی؛ از فایل خارج نمی‌شوند) ──────────────────
const ALLOWED_STATUSES = ['pending', 'active', 'blocked'];

const toEnglishDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
   .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const cleanStr = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

// آیدی شبکه‌های اجتماعی: فقط حروف انگلیسی، عدد، نقطه و زیرخط
const cleanHandle = (v: unknown, max = 64) =>
  String(v ?? '').trim().replace(/^@/, '').replace(/[^A-Za-z0-9._]/g, '').slice(0, max);

// فقط تصاویر Cloudinary خودمان
const cleanImageUrl = (v: unknown): string | null => {
  const s = String(v ?? '').trim();
  if (!s || s.length > 500) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' && u.hostname === 'res.cloudinary.com' ? s : null;
  } catch {
    return null;
  }
};

const callerIp = async () => {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
};

// آیا فراخوان‌کننده ادمین است؟ (requireAdmin باید در صورت ادمین‌نبودن throw کند)
const isAdminCaller = async () => {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
};

const FAIL_FORBIDDEN = { success: false, message: 'دسترسی غیرمجاز' };

// ─── توابع ──────────────────────────────────────────────────────────

export async function getLeadersFromDb() {
  await requireAdmin();
  // 🔒 هرگز password به مرورگر برگردانده نمی‌شود
  const leaders = await prisma.leader.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      fullName: true,
      username: true,
      mobile: true,
      nationalId: true,
      address: true,
      instagram: true,
      telegram: true,
      whatsapp: true,
      rubika: true,
      status: true,
      blockedAt: true,
      createdAt: true,
    },
  });
  // تاریخ مسدودی به رشته تبدیل می‌شود تا در مرورگر مشکل سریالایز نداشته باشد
  return leaders.map((l) => ({
    ...l,
    blockedAt: l.blockedAt ? l.blockedAt.toISOString() : null,
  }));
}

export async function createLeaderInDb(data: any, pathName: string) {
  // ۱. اول امنیت و دسترسی ادمین بررسی شود
  await requireAdmin();

  const username = cleanStr(data?.username, 32).toLowerCase();
  const nationalId = toEnglishDigits(cleanStr(data?.nationalCode || data?.nationalId, 20));
  const mobile = toEnglishDigits(cleanStr(data?.phone || data?.mobile, 20));

  // نام کاربری در آدرس (slug) استفاده می‌شود؛ فقط کاراکترهای امن
  if (!/^[a-z0-9_-]{3,32}$/.test(username)) {
    return { success: false, message: 'نام کاربری باید ۳ تا ۳۲ حرف انگلیسی، عدد، خط‌تیره یا زیرخط باشد.' };
  }
  if (!/^09\d{9}$/.test(mobile)) {
    return { success: false, message: 'شماره موبایل نامعتبر است.' };
  }
  if (nationalId && !/^\d{10}$/.test(nationalId)) {
    return { success: false, message: 'کد ملی باید ۱۰ رقم باشد.' };
  }

  const existingUser = await prisma.leader.findFirst({
    where: {
      OR: [
        { username },
        { slug: username },
        ...(nationalId ? [{ nationalId }] : []),
        { mobile },
      ],
    },
    select: { id: true },
  });

  if (existingUser) {
    return {
      success: false,
      message: 'خطا: نام کاربری، کد ملی یا شماره موبایل وارد شده تکراری است و قبلاً ثبت شده است.',
    };
  }

  // ۲. رمز اولیه: اگر ادمین ننوشت، رمز تصادفی ساخته می‌شود (دیگر 123456 نیست)
  let rawPassword = data?.password ? String(data.password).trim() : '';
  if (rawPassword && (rawPassword.length < 8 || rawPassword.length > 72)) {
    return { success: false, message: 'رمز اولیه باید بین ۸ تا ۷۲ کاراکتر باشد.' };
  }
  if (!rawPassword) rawPassword = generatePassword();
  const securePassword = await hashPassword(rawPassword);

  try {
    const newLeader = await prisma.leader.create({
      data: {
        slug: username,
        fullName: cleanStr(data?.fullName, 80),
        username,
        nationalId: nationalId || null, // خالی = null (فیلد unique است)
        mobile,
        address: cleanStr(data?.address, 200),
        password: securePassword,
        mustChangePassword: true, // ۳. اجبار لیدر به تغییر رمز در اولین ورود
        status: 'active',
        instagram: cleanHandle(data?.instagram),
        telegram: cleanHandle(data?.telegram),
        rubika: cleanHandle(data?.rubika),
        whatsapp: toEnglishDigits(cleanStr(data?.whatsapp, 20)).replace(/\D/g, ''),
      },
      select: { id: true, slug: true, username: true },
    });

    revalidatePath(pathName);
    // رمز اولیه فقط همین یک بار به ادمین برمی‌گردد تا به لیدر بدهد
    return { success: true, data: newLeader, initialPassword: rawPassword, message: 'لیدر با موفقیت ثبت شد' };
  } catch (error) {
    console.error('Create leader error:', error);
    return { success: false, message: 'خطا در ثبت لیدر (احتمالاً اطلاعات تکراری است).' };
  }
}

export async function updateLeaderInDb(leader: any, pathName: string) {
  await requireAdmin();

  const id = cleanStr(leader?.id, 64);
  if (!id) return { success: false, message: 'شناسه لیدر نامعتبر است.' };

  const username = cleanStr(leader?.username, 32).toLowerCase();
  const mobile = toEnglishDigits(cleanStr(leader?.mobile, 20));
  const nationalId = toEnglishDigits(cleanStr(leader?.nationalId, 20));

  if (!/^[a-z0-9_-]{3,32}$/.test(username)) {
    return { success: false, message: 'نام کاربری نامعتبر است.' };
  }
  if (!/^09\d{9}$/.test(mobile)) {
    return { success: false, message: 'شماره موبایل نامعتبر است.' };
  }
  if (nationalId && !/^\d{10}$/.test(nationalId)) {
    return { success: false, message: 'کد ملی باید ۱۰ رقم باشد.' };
  }

  // تکراری نبودن (به‌جز خود همین لیدر)
  const dup = await prisma.leader.findFirst({
    where: {
      id: { not: id },
      OR: [{ username }, ...(nationalId ? [{ nationalId }] : []), { mobile }],
    },
    select: { id: true },
  });
  if (dup) {
    return { success: false, message: 'نام کاربری، کد ملی یا موبایل تکراری است.' };
  }

  try {
    await prisma.leader.update({
      where: { id },
      data: {
        fullName: cleanStr(leader?.fullName, 80),
        username,
        nationalId: nationalId || null,
        mobile,
        address: cleanStr(leader?.address, 200),
        instagram: cleanHandle(leader?.instagram),
        telegram: cleanHandle(leader?.telegram),
        whatsapp: toEnglishDigits(cleanStr(leader?.whatsapp, 20)).replace(/\D/g, ''),
        rubika: cleanHandle(leader?.rubika),
      },
    });
  } catch (error) {
    console.error('Update leader error:', error);
    return { success: false, message: 'خطا در ویرایش اطلاعات لیدر.' };
  }

  revalidatePath(pathName);
  return { success: true, message: "" };
}

export async function deleteLeaderFromDb(id: string, pathName: string) {
  await requireAdmin();
  const leaderId = cleanStr(id, 64);
  if (!leaderId) return { success: false, message: 'شناسه نامعتبر است.' };

  try {
    await prisma.$transaction([
      prisma.passenger.deleteMany({ where: { leaderId } }),
      prisma.tour.deleteMany({ where: { OR: [{ tenantId: leaderId }, { leaderId }] } }),
      prisma.leader.delete({ where: { id: leaderId } }),
    ]);
  } catch (error) {
    console.error('Delete leader error:', error);
    return { success: false, message: 'خطا در حذف لیدر.' };
  }

  revalidatePath(pathName);
  return { success: true, message: "" };
}

export async function deleteAllRecordsForLeader(tenantSlug: string, pathName: string) {
  try {
    // 🔒 فقط خود لیدر (روی مسافران خودش) یا ادمین
    const admin = await isAdminCaller();
    let ownerId: string | null = null;
    if (!admin) {
      const auth = await requireActiveLeader();
      if (!auth.ok) return FAIL_FORBIDDEN;
      ownerId = auth.leader.id;
    }

    const key = cleanStr(tenantSlug, 64);
    const leader = await prisma.leader.findFirst({
      where: { OR: [{ slug: key }, { id: key }] },
      select: { id: true },
    });
    if (!leader || (ownerId && leader.id !== ownerId)) return FAIL_FORBIDDEN;

    await prisma.passenger.deleteMany({
      where: { leaderId: leader.id }
    });

    revalidatePath(pathName);
    return { success: true, message: "تمامی مسافران با موفقیت از دیتابیس حذف شدند." };
  } catch (error) {
    console.error("Delete All Error:", error);
    return { success: false, message: "خطا در حذف رکوردها از دیتابیس." };
  }
}

export async function updateAdminPassword(newPass: string, pathName: string) {
  await requireAdmin();
  // رمز ادمین در متغیر محیطی (ADMIN_PASSWORD_HASH) نگه‌داری می‌شود و از مسیر API تغییر می‌کند
  revalidatePath(pathName);
  return { success: true, message: "" };
}

export async function updateLeaderStatusInDb(id: string, status: string, pathName: string) {
  await requireAdmin();
  if (!ALLOWED_STATUSES.includes(status)) {
    return { success: false, message: 'وضعیت نامعتبر است.' };
  }
  const leaderId = cleanStr(id, 64);
  const current = await prisma.leader.findUnique({
    where: { id: leaderId },
    select: { blockedAt: true },
  });
  if (!current) return { success: false, message: 'لیدر یافت نشد.' };

  await prisma.leader.update({
    where: { id: leaderId },
    data: {
      status,
      // اگر تازه مسدود شد تاریخ ثبت شود؛ اگر از مسدودی درآمد پاک شود
      blockedAt: status === 'blocked' ? (current.blockedAt ?? new Date()) : null,
    },
  });
  revalidatePath(pathName);
  return { success: true, message: "" };
}

export async function updatePassword(id: string, newPassword: string, pathName: string) {
  await requireAdmin();
  const pass = String(newPassword ?? '').trim();
  if (pass.length < 8 || pass.length > 72) {
    return { success: false, message: 'رمز باید بین ۸ تا ۷۲ کاراکتر باشد.' };
  }
  // 🔒 رمز هرگز به‌صورت متن ساده ذخیره نمی‌شود
  const hashed = await hashPassword(pass);
  await prisma.leader.update({
    where: { id: cleanStr(id, 64) },
    data: { password: hashed, mustChangePassword: true },
  });
  revalidatePath(pathName);
  return { success: true, message: "" };
}

export async function resetLeaderPasswordInDb(id: string, pathName: string = "/admin") {
  await requireAdmin();
  // رمز موقت تصادفی (به‌جای 123456 ثابت)
  const newPassword = generatePassword();
  const hashedPassword = await hashPassword(newPassword);
  await prisma.leader.update({
    where: { id: cleanStr(id, 64) },
    data: {
      password: hashedPassword,
      mustChangePassword: true
    }
  });
  revalidatePath(pathName);
  return { success: true, newPassword, message: "" };
}

export async function deleteSingleRecord(id: string, modelName: string, pathName: string) {
  try {
    const admin = await isAdminCaller();
    const recordId = cleanStr(id, 64);
    if (!recordId) return { success: false, message: 'شناسه نامعتبر است.' };

    if (modelName === 'passenger' || modelName === 'tour') {
      // ادمین: هر رکورد. لیدر: فقط رکورد خودش
      let ownerId: string | null = null;
      if (!admin) {
        const auth = await requireActiveLeader();
        if (!auth.ok) return FAIL_FORBIDDEN;
        ownerId = auth.leader.id;
      }
      const where = ownerId ? { id: recordId, leaderId: ownerId } : { id: recordId };
      const result = modelName === 'passenger'
        ? await prisma.passenger.deleteMany({ where })
        : await prisma.tour.deleteMany({ where });
      if (result.count === 0) return { success: false, message: 'رکورد یافت نشد.' };
    } else if (modelName === 'leader') {
      if (!admin) return FAIL_FORBIDDEN;
      await prisma.leader.delete({ where: { id: recordId } });
    } else {
      // قبلاً هر مقدار ناشناخته‌ای «لیدر» را حذف می‌کرد؛ حالا رد می‌شود
      return { success: false, message: 'نوع رکورد نامعتبر است.' };
    }
    revalidatePath(pathName);
    return { success: true, message: "" };
  } catch (error) {
    console.error("Delete Record Error:", error);
    return { success: false, message: "خطا در حذف رکورد." };
  }
}

export async function deletesSingleRecord(id: string, modelName: string, pathName: string) {
  return await deleteSingleRecord(id, modelName, pathName);
}

// === توابع جدید مربوط به مدیریت و ثبت تورها و گالری تصاویر ===

export async function getToursByLeader(tenantSlug: string) {
  try {
    const key = cleanStr(tenantSlug, 64);
    const leader = await prisma.leader.findFirst({
      where: { OR: [{ slug: key }, { id: key }] },
      select: { id: true, status: true },
    });
    if (!leader || !isActive(leader.status)) return [];

    // فقط فیلدهای عمومی تور
    return await prisma.tour.findMany({
      where: { leaderId: leader.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, title: true, date: true, price: true, images: true,
        duration: true, startDate: true, endDate: true, services: true, transportType: true,
      },
    });
  } catch (error) {
    console.error("Error fetching tours:", error);
    return [];
  }
}

export async function saveTourAction(data: { name: string; title?: string; date?: string; price?: string; images: string[]; tenantId: string }, pathName: string) {
  try {
    // 🔒 مالکیت از نشست لیدر خوانده می‌شود، نه از ورودی (tenantId کلاینت نادیده گرفته می‌شود)
    const auth = await requireActiveLeader();
    if (!auth.ok) return FAIL_FORBIDDEN;
    const leaderId = auth.leader.id;

    const name = cleanStr(data?.name, 120);
    if (!name) return { success: false, message: 'نام تور الزامی است.' };

    const priceDigits = toEnglishDigits(String(data?.price ?? '')).replace(/\D/g, '');
    const images = Array.isArray(data?.images)
      ? data.images.slice(0, 8).map(cleanImageUrl).filter((x): x is string => !!x)
      : [];

    await prisma.tour.create({
      data: {
        name,
        title: cleanStr(data?.title, 120) || name,
        date: cleanStr(data?.date, 60),
        price: priceDigits.slice(0, 12),
        images,
        tenantId: leaderId,
        leader: {
          connect: { id: leaderId }
        }
      }
    });
    revalidatePath(pathName);
    return { success: true, message: "تور با موفقیت ثبت شد." };
  } catch (error) {
    console.error("Error saving tour:", error);
    return { success: false, message: "خطا در ذخیره تور در دیتابیس." };
  }
}

// ========================================================

// 🔒 این Server Action عمومی بود و بدون هیچ بررسی مسافر می‌ساخت.
// ثبت‌نام مسافر اکنون فقط از مسیر امن /api/passengers (و پرداخت آنلاین از /api/payment/request) انجام می‌شود.
export async function submitPassengerAction(data: any) {
  return { success: false, message: 'این مسیر غیرفعال شده است. از فرم ثبت‌نام استفاده کنید.' };
}

export async function loginLeaderAction(username: string, pass: string) {
  const rl = checkRateLimit(`lgact:${await callerIp()}`, 10, 15 * 60_000);
  if (!rl.success) {
    return { success: false, message: 'تلاش بیش از حد. بعداً امتحان کنید.', status: '' };
  }

  const leader = await prisma.leader.findFirst({ where: { username: cleanStr(username, 32).toLowerCase() } });
  // 🔒 مقایسه‌ی رمز با bcrypt (قبلاً متن ساده مقایسه می‌شد)
  const ok = !!leader && (await bcrypt.compare(String(pass ?? ''), leader.password ?? ''));
  if (!leader || !ok) {
    return { success: false, message: 'اطلاعات اشتباه است', status: '' };
  }
  return { success: true, leaderKey: leader.slug, status: leader.status, message: "" };
}

export async function loginAdminAction(username: string, pass: string) {
  try {
    const rl = checkRateLimit(`adact:${await callerIp()}`, 5, 15 * 60_000);
    if (!rl.success) {
      return { success: false, message: 'تلاش بیش از حد. بعداً امتحان کنید.' };
    }

    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(pass || '').trim();

    const adminUser = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
    const adminHash = process.env.ADMIN_PASSWORD_HASH || '';

    if (adminUser && adminHash && cleanUser === adminUser) {
      const ok = await bcrypt.compare(cleanPass, adminHash);
      if (ok) {
        return { success: true, message: "ورود موفقیت‌آمیز ادمین کل" };
      }
    }

    return { success: false, message: 'نام کاربری یا رمز عبور ادمین اشتباه است' };
  } catch (error) {
    console.error('Admin Login Error:', error);
    return { success: false, message: 'خطای سرور در ورود ادمین' };
  }
}

export async function deleteAllRecords(pathName: string) {
  try {
    await requireAdmin();

    // 🔒 پاک‌کردن کل دیتابیس فقط وقتی مجاز است که صراحتاً در Render فعال شده باشد
    if (process.env.ALLOW_DELETE_ALL !== 'true') {
      return { success: false, message: "حذف کامل دیتابیس در این محیط غیرفعال است." };
    }

    await prisma.passenger.deleteMany({});
    await prisma.tour.deleteMany({});
    await prisma.leader.deleteMany({});

    revalidatePath(pathName);
    return { success: true, message: "کلیه اطلاعات با موفقیت از دیتابیس پاک شدند." };
  } catch (error) {
    console.error("Delete All Error:", error);
    return { success: false, message: "خطا در حذف اطلاعات از دیتابیس." };
  }
}