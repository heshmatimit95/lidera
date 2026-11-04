import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_SIZE = 5 * 1024 * 1024; // ۵ مگابایت
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'فایلی ارسال نشده است' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'فقط تصویر JPG, PNG یا WEBP مجاز است' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: 'حجم تصویر نباید بیشتر از ۵ مگابایت باشد' }, { status: 400 });
    }

    const url = process.env.CLOUDINARY_URL?.trim();
    if (!url || !url.startsWith('cloudinary://')) {
      console.error('CLOUDINARY_URL نامعتبر یا تعریف‌نشده است');
      return NextResponse.json({ success: false, message: 'پیکربندی آپلود سمت سرور ناقص است' }, { status: 500 });
    }

    const { v2: cloudinary } = await import('cloudinary');
    cloudinary.config({ url });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const uploadResult = await cloudinary.uploader.upload(fileBase64, {
      folder: 'lidera_uploads',
    });

    return NextResponse.json({ success: true, url: uploadResult.secure_url });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return NextResponse.json({ success: false, message: 'خطا در آپلود تصویر' }, { status: 500 });
  }
}