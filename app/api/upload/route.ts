import { NextResponse, NextRequest } from 'next/server';
// @ts-ignore
import cloudinary from '../../../lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'فایلی ارسال نشده است' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // آپلود مستقیم به کلودینری به صورت استریم
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'lidera_uploads' }, // نام پوشه در فضای ابری شما
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url, // لینک مستقیم و امن تصویر
    });

  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return NextResponse.json({ success: false, message: 'خطا در آپلود تصویر' }, { status: 500 });
  }
}