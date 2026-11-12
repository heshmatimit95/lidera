'use server'

import { prisma } from "../lib/db";
import { requireActiveLeader } from "../lib/auth";
import { checkRateLimit } from "../lib/rate-limit";
import { revalidatePath } from "next/cache";

const cleanStr = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export async function generateTourAiItinerary(tourId: string, destination: string, days: number = 3, theme: string = "گردشگری و طبیعت‌گردی", customPrompt?: string) {
  try {
    // 🔒 فقط لیدر واردشده و فعال (قبلاً هر کسی از بیرون می‌توانست اعتبار OpenAI را مصرف کند)
    const auth = await requireActiveLeader();
    if (!auth.ok) return { success: false, message: "دسترسی غیرمجاز." };

    // 🔒 سقف تعداد درخواست برای هر لیدر
    const rl = checkRateLimit(`ai:${auth.leader.id}`, 10, 60 * 60_000);
    if (!rl.success) return { success: false, message: "تعداد درخواست‌ها زیاد است. کمی بعد تلاش کنید." };

    // ورودی‌ها محدود و پاکسازی می‌شوند
    const safeDestination = cleanStr(destination, 80);
    const safeTheme = cleanStr(theme, 80) || "گردشگری و طبیعت‌گردی";
    const safeDays = Math.min(Math.max(Math.floor(Number(days)) || 3, 1), 14);
    const safeCustom = customPrompt ? cleanStr(customPrompt, 1500) : '';
    if (!safeDestination && !safeCustom) return { success: false, message: "مقصد یا درخواست را وارد کنید." };

    const prompt = safeCustom || `شما یک تورلیدر و برنامه‌ریز حرفه‌ای تورهای گردشگری در ایران هستید. 
لطفاً برای یک تور ${safeDestination} با سبک "${safeTheme}" ${safeDays} روزه به زبان فارسی و با لحن جذاب تولید کنید:
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

    // تماس با OpenAI با مهلت ۲۰ ثانیه و سقف طول پاسخ
    let response: Response | null = null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20_000);
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 1500
        }),
        signal: ctrl.signal,
        cache: 'no-store'
      });
    } catch {
      response = null;
    } finally {
      clearTimeout(timer);
    }

    let dayByDayContent = "";
    let packingListContent = "";
    let promoTextContent = "";

    if (response && response.ok) {
      const aiData = await response.json();
      const rawText = aiData.choices?.[0]?.message?.content || "";

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
        promoTextContent = `تور جذاب ${safeDestination} (${safeDays} روزه) - هم اکنون ثبت‌نام کنید! 🌟`;
      }
    } else {
      dayByDayContent = `🌟 برنامه سفر ${safeDestination} (${safeDays} روزه)\n- حرکت به سمت مقصد و گشت‌وگذار.`;
      packingListContent = "کفش مناسب، مدارک شناسایی و لوازم شخصی.";
      promoTextContent = `🌟 تور فوق‌العاده ${safeDestination} در ${safeDays} روز!`;
    }

    const aiRecord = await prisma.aiItinerary.create({
      data: {
        dayByDay: dayByDayContent,
        packingList: packingListContent,
        promoText: promoTextContent,
        leaderId: auth.leader.id, // هر برنامه متعلق به لیدر سازنده‌اش است
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
    return { success: false, message: "خطا در تولید برنامه سفر. دوباره تلاش کنید." };
  }
}

export async function getLatestAiItinerary() {
  try {
    // 🔒 فقط آخرین برنامه‌ی خودِ لیدر (قبلاً آخرین برنامه‌ی همه‌ی لیدرها برگردانده می‌شد)
    const auth = await requireActiveLeader();
    if (!auth.ok) return { success: false, data: null };

    const itinerary = await prisma.aiItinerary.findFirst({
      where: { leaderId: auth.leader.id },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: itinerary };
  } catch (error) {
    return { success: false, data: null };
  }
}