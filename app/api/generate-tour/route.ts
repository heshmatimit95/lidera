import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // کلید خوانده شده از Environment Variables
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'کلید API OpenRouter تنظیم نشده است' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { tourName, days, category, customInstruction } = body;

    let prompt = `برنامه سفر ${days || 3} روزه برای تور "${tourName || 'طبیعت‌گردی'}" در دسته "${category || 'عمومی'}".`;
    if (customInstruction) {
      prompt += ` دستور ویژه لیدر: "${customInstruction}".`;
    }

    prompt += ` پاسخ را فقط و فقط در قالب یک JSON معتبر بدون هیچ مارک‌داون یا توضیحات اضافی بدهید:
{
  "dayByDay": ["روز ۱: توضیحات", "روز ۲: توضیحات"],
  "packingList": ["مورد ۱", "مورد ۲"],
  "promoText": "متن تبلیغاتی جذاب"
}`;

    // ارسال درخواست مستقیم به OpenRouter با مدل رایگان و پرسرعت Llama / DeepSeek
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://lidera.ir",
        "X-Title": "Lidera Tour Assistant",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "meta-llama/llama-3.3-70b-instruct:free", // مدل پرسرعت، قدرتمند و رایگان
        "messages": [
          { "role": "user", "content": prompt }
        ],
        "temperature": 0.7
      })
    });

    const resultData = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API Error:", resultData);
      return NextResponse.json(
        { success: false, error: resultData.error?.message || 'خطا در دریافت پاسخ از هوش مصنوعی' },
        { status: response.status }
      );
    }

    const rawText = resultData.choices?.[0]?.message?.content || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (e) {
      parsedData = {
        dayByDay: [rawText],
        packingList: ["کفش پیاده‌روی", "کوله پشتی", "داروهای شخصی"],
        promoText: `یک تجربه فوق‌العاده و فراموش‌نشدنی با تور ${tourName || ''}!`
      };
    }

    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("Server Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}