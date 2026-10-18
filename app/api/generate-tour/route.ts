import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'کلید GEMINI_API_KEY تنظیم نشده است' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { tourName, days, category } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `یک برنامه سفر ${days} روزه برای تور "${tourName}" در دسته‌بندی "${category}" بساز. پاسخ را به‌صورت یک JSON معتبر شامل ۳ بخش dayByDay، packingList و promoText برگردان. از قرار دادن هرگونه توضیح اضافی یا علامت‌های مارک‌داون مثل \`\`\`json خودداری کن و فقط JSON خالص برگردان.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // پاکسازی کامل مارک‌داون‌های احتمالی
    const cleanJson = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const data = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'خطا در برقراری ارتباط با هوش مصنوعی' },
      { status: 500 }
    );
  }
}