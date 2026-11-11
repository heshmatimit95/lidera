'use server'
import { prisma } from "../../lib/db";
import { requireActiveLeader } from "../../lib/auth";

const cleanStr = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

// فقط تصاویر Cloudinary خودمان
const cleanImageUrl = (v: unknown): string | null => {
  const s = String(v ?? '').trim();
  if (!s || s.length > 500) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' && u.hostname === 'res.cloudinary.com' ? s : null;
  } catch {
    return null;
  }
};

export async function uploadTourImages(formData: FormData) {
  // 🔒 فقط لیدر واردشده و فعال
  const auth = await requireActiveLeader();
  if (!auth.ok) return { success: false, message: "دسترسی غیرمجاز." };

  const tourId = cleanStr(formData.get("tourId"), 64);
  if (!tourId) return { success: false, message: "شناسه تور نامعتبر است." };

  // 🔒 تور باید متعلق به همین لیدر باشد
  const tour = await prisma.tour.findFirst({
    where: { id: tourId, leaderId: auth.leader.id },
    select: { id: true },
  });
  if (!tour) return { success: false, message: "تور یافت نشد." };

  const dataToUpdate: any = {};

  // چک کردن هر ۴ تصویر: فقط لینک Cloudinary (نوشتن فایل روی دیسک سرور حذف شد)
  for (let i = 1; i <= 4; i++) {
    const value = formData.get(`image${i}`);
    if (typeof value === 'string' && value.trim()) {
      const url = cleanImageUrl(value);
      if (!url) return { success: false, message: `لینک تصویر ${i} نامعتبر است.` };
      dataToUpdate[`image${i}`] = url;
    } else if (value && typeof value !== 'string' && (value as File).size > 0) {
      return { success: false, message: "ابتدا تصاویر را از طریق آپلود امن ارسال کنید و لینک آن‌ها را بفرستید." };
    }
  }

  if (Object.keys(dataToUpdate).length === 0) {
    return { success: false, message: "تصویری ارسال نشد." };
  }

  try {
    await prisma.tour.update({
      where: { id: tour.id },
      data: dataToUpdate,
    });

    return { success: true, message: "عکس‌ها با موفقیت آپلود شدند." };
  } catch (error) {
    console.error("Upload Error:", error);
    return { success: false, message: "خطا در آپلود عکس‌ها" };
  }
}