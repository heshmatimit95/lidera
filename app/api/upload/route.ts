import { NextResponse, NextRequest } from 'next/server';
import cloudinary from '../../lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'فایلی ارسال نشده است' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // تبدیل بافر به Data URI برای ارسال امن و آسان به کلودینری
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