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
      return NextResponse.json({ success: false, message: 'مجاز است JPG, PNG یا WEBP فقط تصویر ' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: 'حجم تصویر نباید بیشتر از ۵ مگابایت باشد' }, { status: 400 });
    }

    const { v2: cloudinary } = await import('cloudinary');
    
    // تنظیم مستقیم بدون وابستگی به متغیرهای سردرگم‌کننده
    cloudinary.config({
      cloud_name: 'vkuhspb3',
      api_key: '113913565293999',
      api_secret: process.env.CLOUDINARY_API_SECRET, // این یکی حتماً از سرور خوانده می‌شود
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const uploadResult: any = await cloudinary.uploader.upload(fileBase64, {
      folder: 'lidera_uploads',
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error('Cloudinary Upload Error Details:', error);
    return NextResponse.json({ success: false, message: 'خطا در آپلود تصویر: ' + (error.message || '') }, { status: 500 });
  }
}