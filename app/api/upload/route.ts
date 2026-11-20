import { NextResponse, NextRequest } from 'next/server';
import { checkRateLimit } from '@/app/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_SIZE = 5 * 1024 * 1024; // ۵ مگابایت
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';

// تشخیص نوع واقعی فایل از روی بایت‌های ابتدایی (نوع اعلام‌شده‌ی کلاینت قابل جعل است)
function sniffImageType(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // این مسیر برای فرم عمومی ثبت‌نام (فیش واریزی) هم استفاده می‌شود؛ پس محدودیت تعداد لازم است
    const rl = checkRateLimit(`upload:${clientIp(req)}`, 20, 10 * 60_000);
    if (!rl.success) {
      return NextResponse.json({ success: false, message: 'تعداد آپلود زیاد است. کمی بعد تلاش کنید.' }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'فایلی ارسال نشده است' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'فقط تصویر JPG، PNG یا WEBP مجاز است' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: 'حجم تصویر نباید بیشتر از ۵ مگابایت باشد' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // محتوای واقعی فایل باید تصویر مجاز باشد
    const realType = sniffImageType(buffer);
    if (!realType) {
      return NextResponse.json({ success: false, message: 'فایل ارسالی تصویر معتبر نیست' }, { status: 400 });
    }
    const fileBase64 = `data:${realType};base64,${buffer.toString('base64')}`;

    // ارسال مستقیم به API عمومی کلودینری با فچ (بدون نیاز به کتابخانه و Secret)
    const cloudinaryData = new URLSearchParams();
    cloudinaryData.append('file', fileBase64);
    cloudinaryData.append('upload_preset', 'lidera_preset'); // همان پریستی که ساختی
    cloudinaryData.append('folder', 'lidera_uploads');

    // مهلت ۲۰ ثانیه برای تماس با کلودینری
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20_000);
    let response: Response;
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/vkuhspb3/image/upload`,
        { method: 'POST', body: cloudinaryData, signal: ctrl.signal }
      );
    } finally {
      clearTimeout(timer);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.secure_url) {
      console.error('Cloudinary Upload Error:', data?.error?.message || response.status);
      return NextResponse.json({ success: false, message: 'خطا در آپلود تصویر' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      url: data.secure_url,
    });
  } catch (error: any) {
    console.error('Cloudinary Upload Error Details:', error);
    return NextResponse.json({ success: false, message: 'خطا در آپلود تصویر' }, { status: 500 });
  }
}