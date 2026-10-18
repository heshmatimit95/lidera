import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { tourName, days = 3, category = 'طبیعت‌گردی' } = await req.json();

    if (!tourName) {
      return NextResponse.json(
        { error: 'نام تور الزامی است.' },
        { status: 400 }
      );
    }

    // استفاده از API Key ذخیره شده در محیط (Environment Variable)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // اگر کلید API تنظیم نشده بود، خروجی هوشمند فال‌بک آماده می‌شود
      return NextResponse.json({
        success: true,
        data: {
          dayByDay: `📌 برنامه پیشنهادی سفر ${days} روزه به ${tourName}:\n• روز ۱: حرکت، استقرار در اقامتگاه و گشت اولیه در منطقه ${tourName}.\n• روز ۲: بازدید از اصلی‌ترین جاذبه‌ها، عکاسی و صرف غذای محلی.\n• روز ۳: زمان آزاد برای خرید سوغات، جمع‌آوری وسایل و بازگشت.`,
          packingList: `🎒 چک‌لیست وسایل ضروری برای تور ${category} (${tourName}):\n- مدارک شناسایی، کارت بانکی و بیمه\n- کفش مناسب پیاده‌روی و لباس متناسب با فصل\n- داروها و لوازم بهداشتی شخصی\n- پاوربانک و شارژر`,
          promoText: `🌟 تور استثنایی ${days} روزه ${tourName}!\n✨ تجربه یک سفر فراموش‌نشدنی همراه با تور لیدر مجرب.\nجهت ثبت‌نام و رزرو صندلی همین حالا پیام دهید! 🚀`
        }
      });
    }

    // ساخت پرامپت دقیق برای دریافت خروجی ساختاریافته JSON از Gemini
    const prompt = `تو یک تور لیدر و برنامه‌ریز ارشد گردشگری هستی.
برای یک تور با مشخصات زیر:
- نام مقصد/تور: ${tourName}
- تعداد روز: ${days} روز
- دسته‌بندی: ${category}

لطفاً دقیقاً یک پاسخ در قالب JSON خالص (بدون هیچ متن اضافی، بدون markdown code block) به شکل زیر تولید کن:
{
  "dayByDay": "برنامه ریز به ریز روزها با ایموجی‌های مناسب",
  "packingList": "چک‌لیست وسایل ضروری همراه با ایموجی",
  "promoText": "متن جذاب و تبلیغاتی برای پست/استوری اینستاگرام و واتس‌اپ"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const aiResult = await response.json();
    const rawText = aiResult?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('پاسخی از هوش مصنوعی دریافت نشد.');
    }

    // پاکسازی احتمالی تگ‌های مارک‌داون کد از پاسخ JSON
    const cleanJsonText = rawText.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonText);

    return NextResponse.json({
      success: true,
      data: {
        dayByDay: parsedData.dayByDay || '',
        packingList: parsedData.packingList || '',
        promoText: parsedData.promoText || ''
      }
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json(
      { error: 'خطا در برقراری ارتباط با هوش مصنوعی.' },
      { status: 500 }
    );
  }
}