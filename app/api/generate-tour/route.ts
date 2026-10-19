import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'کلید GEMINI_API_KEY در متغیرهای محیطی تنظیم نشده است' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { tourName, days, category, customInstruction } = body;

    let prompt = `برنامه سفر کوتاه و فشرده ${days || 3} روزه برای تور "${tourName || 'طبیعت‌گردی'}" در دسته "${category || 'عمومی'}".`;
    
    if (customInstruction) {
      prompt += ` دستور ویژه لیدر: "${customInstruction}".`;
    }

    prompt += ` فقط پاسخ را در قالب یک JSON معتبر برگردان (بدون هیچ کد یا متن اضافه):
{
  "dayByDay": ["روز ۱: توضیحات کوتاه", "روز ۲: توضیحات کوتاه"],
  "packingList": ["وسایل ضروری ۱", "وسایل ضروری ۲"],
  "promoText": "متن کوتاه تبلیغاتی"
}`;

    // استفاده از endpoint معتبر جمینی
const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        }),
      }
    );

    // اگر پاسخ سرور گوگل ۵۰۰ یا خطا بود
    if (!response.ok) {
      const errText = await response.text();
      console.error('Google API Error:', errText);
      return NextResponse.json(
        { success: false, error: 'خطا از سمت API گوگل: ' + response.status },
        { status: response.status }
      );
    }

    const resultData = await response.json();
    const rawText = resultData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // پاکسازی پاسخ JSON از مارک‌داون
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (e) {
      parsedData = {
        dayByDay: [cleanJson],
        packingList: ["لوازم عمومی سفر"],
        promoText: "برنامه سفر تور " + tourName
      };
    }

    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error('Server Route Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}