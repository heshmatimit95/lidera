import { NextResponse, NextRequest } from 'next/server';
import { requireActiveLeader } from '../../lib/auth';
import { checkRateLimit } from '../../lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_SIZE = 5 * 1024 * 1024; // ۵ مگابایت
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// بررسی امضای واقعی فایل (نوع اعلامی کلاینت قابل اعتماد نیست)
function hasImageSignature(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return jpeg || png || webp;
}

export async function POST(req: NextRequest) {
  try {
    // 👈 بررسی امنیتی: اگر لیدر وارد شده باشد (و فعال)، با سقف بالاتر؛ در غیر این صورت (مسافر) با سقف سخت‌گیرانه
    const auth = await requireActiveLeader({ allowMustChange: true });
    const ip = req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';

    const rl = auth.ok
      ? checkRateLimit(`upload-l:${auth.leader.id}`, 30, 10 * 60_000)
      : checkRateLimit(`upload-ip:${ip}`, 5, 10 * 60_000);
    if (!rl.success) {
      return NextResponse.json({ success: false, message: 'تعداد آپلود بیش از حد مجاز است' }, { status: 429 });
    }

    // اگر آپلود فقط برای لیدر باشد، این بلوک را فعال کن:
    // if (!auth.ok) {
    //   return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    // }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'فایلی ارسال نشده است' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'فقط تصویر JPG، PNG یا WEBP مجاز است' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: 'حجم تصویر نباید بیشتر از ۵ مگابایت باشد' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasImageSignature(buffer)) {
      return NextResponse.json({ success: false, message: 'فایل تصویر معتبر نیست' }, { status: 400 });
    }
    const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // ارسال مستقیم به API عمومی کلودینری با فچ (بدون نیاز به کتابخانه و Secret)
    const cloudinaryData = new URLSearchParams();
    cloudinaryData.append('file', fileBase64);
    cloudinaryData.append('upload_preset', 'lidera_preset');
    cloudinaryData.append('folder', 'lidera_uploads');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);

    let response: Response;
    try {
      response = await fetch(`https://api.cloudinary.com/v1_1/vkuhspb3/image/upload`, {
        method: 'POST',
        body: cloudinaryData,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.secure_url) {
      console.error('Cloudinary upload failed:', response.status, data?.error?.message);
      return NextResponse.json({ success: false, message: 'خطا در آپلود تصویر' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      url: data.secure_url,
    });
  } catch (error) {
    console.error('Cloudinary Upload Error Details:', error);
    return NextResponse.json({ success: false, message: 'خطا در آپلود تصویر' }, { status: 500 });
  }
}