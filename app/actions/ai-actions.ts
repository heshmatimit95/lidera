'use server'

import { prisma } from "../lib/db";
import { revalidatePath } from "next/cache";

export async function generateTourAiItinerary(tourId: string, destination: string, days: number = 3, theme: string = "گردشگری و طبیعت‌گردی", customPrompt?: string) {
  try {
    const prompt = customPrompt || `شما یک تورلیدر و برنامه‌ریز حرفه‌ای تورهای گردشگری در ایران هستید. 
لطفاً برای یک تور ${destination} با سبک "${theme}" ${days} روزه به زبان فارسی و با لحن جذاب تولید کنید:
1. برنامه کامل روزانه (به تفکیک روزها و بازدیدها)
2. پاسخ به سوالات مشاوره سفر یا نکات ایمنی و چکسیست وسایل
3. یک متن جذاب تبلیغاتی برای اینستاگرام و واتساپ همراه با ایموجی و اشتیاق.

پاسخ را دقیقاً در قالب فرمت زیر ارسال کنید:
---PROGRAM---
(برنامه روزانه)
---PACKING---
(نکات مشاوره یا چکسیست وسایل)
---PROMO---
(متن تبلیغاتی اینستاگرام)`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY || ''}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    let dayByDayContent = "";
    let packingListContent = "";
    let promoTextContent = "";

    if (response.ok) {
      const aiData = await response.json();
      const rawText = aiData.choices[0]?.message.content || "";

      // تفکیک هوشمند بخش‌های مختلف پاسخ هوش مصنوعی
      const parts = rawText.split(/---PROGRAM---|---PACKING---|---PROMO---/);
      if (parts.length >= 4) {
        dayByDayContent = parts[1]?.trim() || "";
        packingListContent = parts[2]?.trim() || "";
        promoTextContent = parts[3]?.trim() || "";
      } else {
        // اگر فرمت رعایت نشده بود، متن رو هوشمند تقسیم می‌کنیم
        dayByDayContent = rawText;
        packingListContent = "می‌توانید سوالات خود را درباره این تور بپرسید تا راهنماییتان کنم.";
        promoTextContent = `تور جذاب ${destination} (${days} روزه) - هم اکنون ثبت‌نام کنید! 🌟`;
      }
    } else {
      dayByDayContent = `🌟 برنامه سفر ${destination} (${days} روزه)\n- حرکت به سمت مقصد و گشت‌وگذار.`;
      packingListContent = "کفش مناسب، مدارک شناسایی و لوازم شخصی.";
      promoTextContent = `🌟 تور فوق‌العاده ${destination} در ${days} روز!`;
    }

    const aiRecord = await prisma.aiItinerary.create({
      data: {
        dayByDay: dayByDayContent,
        packingList: packingListContent,
        promoText: promoTextContent,
      }
    });

    revalidatePath('/leader');
    return { 
      success: true, 
      message: 'برنامه سفر هوشمند با موفقیت تولید شد!', 
      data: aiRecord 
    };

  } catch (error: any) {
    console.error("AI Generation Detailed Error:", error);
    return { success: false, message: `مشکل در ارتباط با دیتابیس: ${error.message || ''}` };
  }
}

export async function getLatestAiItinerary() {
  try {
    const itinerary = await prisma.aiItinerary.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: itinerary };
  } catch (error) {
    return { success: false, data: null };
  }
}