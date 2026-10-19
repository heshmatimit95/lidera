import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'کلید GEMINI_API_KEY تنظیم نشده است' }, { status: 500 });
    }

    const body = await req.json();
    const { tourName, days, category, customInstruction } = body;

    // راه‌اندازی با کتابخانه رسمی گوگل
    const genAI = new GoogleGenerativeAI(apiKey);
    // استفاده از مدل استاندارد و پایدار
   const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    let prompt = `برنامه سفر ${days || 3} روزه برای تور "${tourName || 'طبیعت‌گردی'}" در دسته "${category || 'عمومی'}".`;
    if (customInstruction) {
      prompt += ` دستور ویژه لیدر: "${customInstruction}".`;
    }

    prompt += ` پاسخ را فقط در قالب یک JSON معتبر بدون هیچ مارک‌داونی بدهید:
{
  "dayByDay": ["روز ۱: ...", "روز ۲: ..."],
  "packingList": ["مورد ۱", "مورد ۲"],
  "promoText": "متن تبلیغاتی"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();

    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (e) {
      parsedData = {
        dayByDay: [rawText],
        packingList: ["وسایل ضروری سفر"],
        promoText: "تور فوق‌العاده " + tourName
      };
    }

    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error('Gemini SDK Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'خطای ارتباط با هوش مصنوعی' }, { status: 500 });
  }
}