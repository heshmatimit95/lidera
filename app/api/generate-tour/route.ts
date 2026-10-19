import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'کلید GEMINI_API_KEY تنظیم نشده است' }, { status: 500 });
    }

    const body = await req.json();
    const { tourName, days, category, customInstruction } = body;

    let prompt = `برنامه سفر ${days || 3} روزه برای تور "${tourName || 'طبیعت‌گردی'}" در دسته "${category || 'عمومی'}".`;
    if (customInstruction) {
      prompt += ` دستور ویژه: "${customInstruction}".`;
    }

    prompt += ` پاسخ را فقط در قالب یک JSON معتبر بدون هیچ مارک‌داونی بدهید:
{
  "dayByDay": ["روز ۱: ...", "روز ۲: ..."],
  "packingList": ["مورد ۱", "مورد ۲"],
  "promoText": "متن تبلیغاتی"
}`;

const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        }),
      }
    );

    const resultData = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ success: false, error: resultData.error?.message || 'خطا از سمت گوگل' }, { status: response.status });
    }

    const rawText = resultData.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
    return NextResponse.json({ success: false, error: error.message || 'خطای سرور' }, { status: 500 });
  }
}