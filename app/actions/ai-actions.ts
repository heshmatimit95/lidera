'use server'
import { prisma } from "../lib/db";
 // یا مسیر صحیحی که بقیه اکشن‌ها استفاده می‌کنند// مسیر دقیق پرایزما کلاینت پروژه خودت
import { revalidatePath } from "next/cache";

// تابع اصلی برای تولید برنامه‌ی سفر با هوش مصنوعی
export async function generateTourAiItinerary(tourId: string, destination: string, days: number, theme: string) {
  try {
    // ۱. شبیه‌سازی / ساخت محتوای هوشمند بر اساس پارامترهای تور
    // (در صورت اتصال به سرویس‌های هوش مصنوعی مثل OpenAI یا پروکسی‌های داخلی، خروجی از آنجا گرفته می‌شود)
    
    const dayByDayContent = `برنامه سفر ${days} روزه به ${destination} با سبک ${theme}:\n` +
      Array.from({ length: days }, (_, i) => `روز ${i + 1}: گشت و گذار در جاذبه‌های برتر ${destination}، عکاسی و استراحت در اقامتگاه بومگردی.`).join('\n');

    const packingListContent = `چک‌لیست وسایل ضروری برای ${destination}:\n- کفش پیاده‌روی مناسب\n- مدارک شناسایی و بیمه\n- لباس مناسب فصل\n- داروهای شخصی و آب‌معدنی`;

    const promoTextContent = `🌟 تور فوق‌العاده ${destination} (${days} روزه)!\n\nاگر به دنبال یک سفر خاطره‌انگیز با سبک ${theme} هستید، همین حالا ثبت‌نام کنید!\n\n✨ ظرفیت محدود است.\nاطلاعات بیشتر در پنل لیدرا.`;

    // ۲. ذخیره یا آپدیت رکورد هوش مصنوعی در جدول AiItinerary
    const aiRecord = await prisma.aiItinerary.create({
      data: {
        dayByDay: dayByDayContent,
        packingList: packingListContent,
        promoText: promoTextContent,
      }
    });

// ۳. اتصال این رکوردِ هوش مصنوعی به تورِ مربوطه (چون فعلاً tourId واقعی نداریم، موقتاً کامنتش می‌کنیم)
    /*
    await prisma.tour.update({
      where: { id: tourId },
      data: {
        aiItineraryId: aiRecord.id
      }
    });
    */

    revalidatePath('/leader'); // رفرش کردن صفحه پنل لیدر برای نمایش تغییرات
    return { success: true, message: 'برنامه سفر با موفقیت توسط هوش مصنوعی تولید شد!' };

 } catch (error: any) {
    console.error("AI Generation Detailed Error:", error);
    return { success: false, message: `خطا: ${error.message || 'مشکل ناشناخته'}` };
  }
}