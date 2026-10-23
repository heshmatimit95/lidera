import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { tourName, days = 3, category = "طبیعت‌گردی", customInstruction } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "کلید هوش مصنوعی تنظیم نشده است" }, { status: 500 });
    }

    const systemPrompt = `تو یک دستیار، مشاور و همراه هوشمند، باانگیزه و همه‌فن‌حریف برای تورلیدرهای پلتفرم «لیدرا» هستی...`;

    const userMessage = customInstruction 
      ? customInstruction 
      : `لطفاً یک تحلیل جامع و برنامه کامل برای تور ${tourName} ارائه بده.`;

    const response = "https://openrouter.ai/api/v1/chat/completions";
    const apiResponse = await fetch(response, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lidera.ir",
        "X-Title": "Lidera AI",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.8,
      }),
    });

    const data = await apiResponse.json();
    
    // چاپ خروجی کامل جهت عارضه‌یابی در ترمینال
    console.log("OpenRouter Full Response:", JSON.stringify(data, null, 2));

    const replyText = data.choices?.[0]?.message?.content || "پاسخی دریافت نشد";

    return NextResponse.json({
      success: true,
      data: {
        dayByDay: [replyText],
        packingList: ["پاسخ هوش مصنوعی به صورت آزاد و پویا ارائه شد."],
        promoText: replyText
      }
    });

  } catch (error: any) {
    console.error("Generate Tour Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}