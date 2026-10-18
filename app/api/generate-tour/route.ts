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

    const { tourName, days, category } = await req.json();

    const prompt = `یک برنامه سفر ${days || 3} روزه برای تور "${tourName}" در دسته‌بندی "${category || "گردشگری"}" بساز. پاسخ را به‌صورت یک JSON معتبر و بدون هیچ متن اضافی برگردان. فرمت پاسخ:
{
  "dayByDay": ["روز ۱: ...", "روز ۲: ..."],
  "packingList": ["کفش مناسب", "عینک"],
  "promoText": "متن تبلیغاتی کوتاه"
}`;

    // استفاده مستقیم از REST API جدیدترین نسخه جمینی (Gemini 2.5 / 2.0 / 1.5)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      console.error('Google API Error:', resultData);
      // fallback به نسخه 2.0 در صورت عدم پشتیبانی کلید
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      const fallbackData = await fallbackResponse.json();
      if (!fallbackResponse.ok) {
        throw new Error(fallbackData.error?.message || 'خطا در فراخوانی مدل جمینی');
      }
      const rawText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return NextResponse.json({ success: true, data: JSON.parse(cleanJson) });
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