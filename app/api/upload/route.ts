import { NextResponse, NextRequest } from 'next/server';
import { checkRateLimit } from '@/app/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_SIZE = 5 * 1024 * 1024; // ۵ مگابایت
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'vkuhspb3';

const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';

// نوع واقعی فایل از روی محتوای آن (نه از روی نوعی که کلاینت ادعا می‌کند)
function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // 🔒 این مسیر برای فرم عمومی ثبت‌نام هم استفاده می‌شود، پس سقف تعداد آپلود برای هر IP
    const rl = checkRateLimit(`upload:${clientIp(req)}`, 15, 10 * 60_000);
    if (!rl.success) {
      return NextResponse.json({ success: false, message: 'تعداد آپلود زیاد است. کمی بعد تلاش کنید.' }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'فایلی ارسال نشده است' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'فقط تصویر JPG, PNG یا WEBP مجاز است' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: 'حجم تصویر نباید بیشتر از ۵ مگابایت باشد' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const realType = sniffImageType(buffer);
    if (!realType || !ALLOWED_TYPES.includes(realType)) {
      return NextResponse.json({ success: false, message: 'فایل ارسالی تصویر معتبر نیست' }, { status: 400 });
    }
    const fileBase64 = `data:${realType};base64,${buffer.toString('base64')}`;

    // ارسال مستقیم به API عمومی کلودینری با فچ (بدون نیاز به کتابخانه و Secret)
    const cloudinaryData = new URLSearchParams();
    cloudinaryData.append('file', fileBase64);
    cloudinaryData.append('upload_preset', 'lidera_preset'); // همان پریستی که ساختی
    cloudinaryData.append('folder', 'lidera_uploads');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Cloudinary error:', data?.error?.message);
      return NextResponse.json({ success: false, message: 'خطا در آپلود تصویر' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      url: data.secure_url,
    });
  } catch (error: any) {
    console.error('Cloudinary Upload Error Details:', error);
    // پیام داخلی خطا به کاربر نشان داده نمی‌شود
    return NextResponse.json({ success: false, message: 'خطا در آپلود تصویر' }, { status: 500 });
  }
}