import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'متغیر GEMINI_API_KEY تنظیم نشده است' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { tourName, days, category, customInstruction } = body;

    let prompt = `یک برنامه سفر کوتاه و جالب ${days || 3} روزه برای تور "${tourName || 'طبیعت‌گردی'}" در دسته "${category || 'عمومی'}".`;
    
    if (customInstruction) {
      prompt += ` دستور ویژه لیدر: "${customInstruction}".`;
    }

    prompt += ` لطفاً پاسخ را دقیقاً در قالب فرمت JSON زیر برگردان (بدون هیچ کد یا متن اضافی):
{
  "dayByDay": ["روز ۱: توضیحات کوتاه", "روز ۲: توضیحات کوتاه"],
  "packingList": ["وسایل ضروری ۱", "وسایل ضروری ۲"],
  "promoText": "متن کوتاه جذاب برای اینستاگرام"
}`;

    // لیست مدل‌های معتبر برای امتحان کردن به ترتیب اولویت
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
    let response: Response | null = null;
    let lastErrorText = '';

    for (const modelName of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        }),
      });

      if (res.ok) {
        response = res;
        break;
      } else {
        lastErrorText = await res.text();
      }
    }

    if (!response) {
      console.error('Gemini API Error All Models Failed:', lastErrorText);
      return NextResponse.json(
        { success: false, error: 'عدم دسترسی به مدل‌های جمینی: ' + lastErrorText },
        { status: 400 }
      );
    }

    const resultData = await response.json();
    const rawText = resultData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // پاکسازی تگ‌های مارک‌داون
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (e) {
      parsedData = {
        dayByDay: [cleanJson],
        packingList: ["وسایل عمومی سفر"],
        promoText: "برنامه سفر تور " + (tourName || '')
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