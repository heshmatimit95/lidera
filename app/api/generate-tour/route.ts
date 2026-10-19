import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'کلید GEMINI_API_KEY تنظیم نشده است' },
        { status: 500 }
      );
    }

    const { tourName, days, category, customInstruction } = await req.json();

    let prompt = `یک برنامه سفر ${days || 3} روزه برای تور "${tourName}" در دسته‌بندی "${category || "گردشگری"}" بساز.`;
    
    if (customInstruction) {
      prompt += ` همچنین این دستور ویژه از طرف تورلیدر را حتماً اعمال کن: "${customInstruction}".`;
    }

    prompt += ` پاسخ را به‌صورت یک JSON معتبر و بدون هیچ متن اضافی یا مارک‌داون برگردان. فرمت پاسخ:
{
  "dayByDay": ["روز ۱: ...", "روز ۲: ..."],
  "packingList": ["کفش مناسب", "عینک"],
  "promoText": "متن تبلیغاتی جذاب برای اینستاگرام و واتساپ"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const resultData = await response.json();

    if (!response.ok) {
      throw new Error(resultData.error?.message || 'خطا در فراخوانی هوش مصنوعی');
    }

    const rawText = resultData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
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