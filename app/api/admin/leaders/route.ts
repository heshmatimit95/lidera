import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { requireAdmin } from '@/app/lib/require-admin'; // 👈 مسیر درست ایمپورت
import { generatePassword, hashPassword } from '@/app/lib/password';

const ALLOWED_STATUSES = ['pending', 'active', 'blocked'];
const USERNAME_RE = /^[a-z0-9_]{3,32}$/;

const cleanStr = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

// هش رمز هرگز به کلاینت برگردانده نمی‌شود
const stripPassword = (leader: any) => {
  const { password, ...rest } = leader;
  return rest;
};

const unauthorized = () => NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });

// GET: دریافت لیست تمام لیدرها
export async function GET() {
  try {
    // 👈 بررسی امنیتی ادمین
    try { await requireAdmin(); } catch { return unauthorized(); }

    const leaders = await prisma.leader.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(leaders.map(stripPassword), { status: 200 });
  } catch (error) {
    console.error('Error fetching leaders:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات از دیتابیس' }, { status: 500 });
  }
}

// POST: ثبت لیدر جدید کاملاً منطبق با اسکمای شما
export async function POST(request: Request) {
  try {
    // 👈 بررسی امنیتی ادمین
    try { await requireAdmin(); } catch { return unauthorized(); }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'درخواست نامعتبر است' }, { status: 400 });
    }

    // تولید یا گرفتن اسلاگ یکتا (فقط حروف کوچک انگلیسی، عدد و _)
    const username = cleanStr(body.username, 32).toLowerCase();
    const generatedSlug = cleanStr(body.slug || body.username, 32).toLowerCase() || `leader_${Date.now()}`;
    if (username && !USERNAME_RE.test(username)) {
      return NextResponse.json({ error: 'نام کاربری فقط شامل حروف کوچک انگلیسی، عدد و _ (۳ تا ۳۲ کاراکتر) باشد' }, { status: 400 });
    }
    if (!USERNAME_RE.test(generatedSlug)) {
      return NextResponse.json({ error: 'اسلاگ نامعتبر است' }, { status: 400 });
    }

    // رمز: اگر ادمین نداده، رمز موقت تصادفی ساخته می‌شود (دیگر رمز ثابت 123456 وجود ندارد)
    const providedPassword = String(body.password ?? '');
    if (providedPassword && providedPassword.length < 8) {
      return NextResponse.json({ error: 'رمز عبور باید حداقل ۸ کاراکتر باشد' }, { status: 400 });
    }
    const rawPassword = providedPassword || generatePassword();
    const hashedPassword = await hashPassword(rawPassword);

    const name = cleanStr(body.name, 60);
    const lastName = cleanStr(body.lastName || body.lastname, 60);
    const status = ALLOWED_STATUSES.includes(String(body.status)) ? String(body.status) : 'active';

    const newLeader = await prisma.leader.create({
      data: {
        slug: generatedSlug,
        name,
        lastName,
        fullName: `${name} ${lastName}`.trim(),
        username: username || null,
        mobile: cleanStr(body.phone || body.mobile, 20) || null,
        nationalId: cleanStr(body.nationalCode || body.nationalId, 20) || null,
        password: hashedPassword,
        mustChangePassword: true, // لیدر باید در اولین ورود رمز را عوض کند
        status,
      },
    });

    // رمز موقت فقط همین یک بار به ادمین نشان داده می‌شود
    return NextResponse.json({ ...stripPassword(newLeader), initialPassword: rawPassword }, { status: 201 });

  } catch (error) {
    console.error('Error creating leader:', error);
    return NextResponse.json({ error: 'خطا در ثبت اطلاعات در دیتابیس (احتمالاً نام کاربری یا موبایل تکراری است)' }, { status: 500 });
  }
}