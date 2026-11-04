import { NextResponse, NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// این خط مانع از تلاش نکست‌جی‌اس برای بیلد استاتیک این مسیر می‌شود
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // تنظیم لحظه‌ای کلودینری با متغیر محیطی
    cloudinary.config({
      url: process.env.CLOUDINARY_URL,
    });

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'فایلی ارسال نشده است' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const uploadResult: any = await cloudinary.uploader.upload(fileBase64, {
      folder: 'lidera_uploads',
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    return NextResponse.json({ success: false, message: 'خطا در آپلود تصویر: ' + (error.message || '') }, { status: 500 });
  }
}