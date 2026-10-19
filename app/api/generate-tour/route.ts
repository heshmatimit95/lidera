import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { tourName, days = 3, category = "طبیعت‌گردی", customInstruction } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "کلید هوش مصنوعی تنظیم نشده است." }, { status: 500 });
    }

    // پرامپت سیستمی برای آزادی کامل هوش مصنوعی به عنوان مشاور تورلیدر
    const systemPrompt = `
تو یک دستیار، مشاور و همراهِ کاملاً هوشمند، باانگیزه و همه‌فن‌حریف برای تورلیدرهای پلتفرم «لیدرا» هستی.
برخلاف ربات‌های خشک، تو کاملاً آزاد هستی که به هر پرسش، دغدغه، ایده، دستورالعمل یا چالشِ تورلیدر (از وضعیت آب‌وهوا، مدیریت بحران در سفر، معرفی جاذبه‌های تاریخی و طبیعی، تا پیشنهاد برنامه‌های سفر جدید یا گپ آزاد) با بالاترین دقت، جذابیت و به زبان فارسی روان، صمیمانه و حرفه‌ای پاسخ دهی.

اطلاعات تور فعلی که تورلیدر درباره‌اش صحبت می‌کند:
- نام تور: ${tourName}
- مدت زمان: ${days} روز
- دسته‌بندی: ${category}

اگر تورلیدر درخواستی برای اصلاح برنامه سفر داشت، برنامه را بازنویسی کن. اگر سوالی پرسید یا درباره موضوعی آزاد صحبت کرد، کاملاً آزاد، مشروح و مفید به او مشاوره بده. هیچ محدودیتی نداری!
`;

    const userMessage = customInstruction 
      ? customInstruction 
      : `لطفاً یک تحلیل جامع و برنامه کامل برای تور ${tourName} ارائه بده و هر نکته مشاوره‌ای که برای یک تورلیدر حرفه‌ای لازم است را بگو.`;

    const response = "https://openrouter.ai/api/v1/chat/completions";
    const apiResponse = await fetch(response, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ` + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lidera.ir",
        "X-Title": "Lidera AI",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat", // یا مدلی که داری
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.8,
      }),
    });

    const data = await apiResponse.json();
    const replyText = data.choices?.[0]?.message?.content || "پاسخی دریافت نشد.";

    // برگرداندن متن به صورت کاملاً آزاد و متنی (بدون اجبار به ساختار JSON خشک)
    return NextResponse.json({ 
      success: true, 
      data: {
        // اینجا متن آزاد رو توی همون ساختار روزانه یا به عنوان متن پاسخ برمی‌گردونیم
        dayByDay: [replyText],
        packingList: ["پاسخ هوش مصنوعی به صورت آزاد و پویا ارائه شد."],
        promoText: replyText
      } 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}