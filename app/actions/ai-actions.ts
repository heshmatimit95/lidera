'use server'

import { prisma } from "../lib/db";
import { revalidatePath } from "next/cache";

export async function generateTourAiItinerary(tourId: string, destination: string, days: number = 3, theme: string = "گردشگری و طبیعت‌گردی") {
  try {
    const prompt = `شما یک تورلیدر و برنامه‌ریز حرفه‌ای تورهای گردشگری در ایران هستید.
لطفاً برای یک تور ${days} روزه به مقصد "${destination}" با سبک "${theme}" موارد زیر را به زبان فارسی و با لحن جذاب تولید کنید:

1. برنامه‌ی کامل روزانه (به تفکیک روزها و بازدیدها)
2. چک‌لیست کامل وسایل ضروری مسافر
3. یک متن جذاب تبلیغاتی برای اینستاگرام و واتس‌اپ همراه با ایموجی و هشتگ

پاسخ را دقیقاً در قالب فرمت زیر ارسال کنید:
---PROGRAM---
(برنامه روزانه)
---PACKING---
(چک‌لیست وسایل)
---PROMO---
(متن تبلیغاتی)
`;

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
      const rawText = aiData.choices[0]?.message?.content || "";
      
      const parts = rawText.split(/---PROGRAM---|---PACKING---|---PROMO---/);
      dayByDayContent = parts[1]?.trim() || rawText;
      packingListContent = parts[2]?.trim() || "کفش مناسب، مدارک شناسایی، داروهای شخصی، لباس مناسب فصل";
      promoTextContent = parts[3]?.trim() || `🌟 تور استثنایی ${destination}!\nثبت‌نام در سامانه لیدرا.`;
    } else {
      dayByDayContent = `📌 برنامه سفر ${days} روزه به ${destination}:\n` +
        Array.from({ length: days }, (_, i) => `• روز ${i + 1}: بازدید از جاذبه‌های برتر و دیدنی‌های ${destination}، صرف غذاهای محلی و اقامت.`).join('\n');
      
      packingListContent = `🎒 چک‌لیست وسایل تور ${destination}:\n- کفش پیاده‌روی راحت\n- مدارک شناسایی و کارت شناسایی\n- داروها و لوازم شخصی\n- لباس مناسب فصل و دوربین عکاسی`;
      
      promoTextContent = `✨ تور جذاب ${destination} (${days} روزه)\n\nبا ما در یک سفر بی‌نظیر به ${destination} همراه شوید!\n📍 اطلاعات بیشتر و ثبت‌نام در پنل اختصاصی لیدرا.`;
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
    return { success: false, message: `خطا: ${error.message || 'مشکل در ارتباط با دیتابیس'}` };
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