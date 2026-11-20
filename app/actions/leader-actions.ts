'use server'

import { prisma } from "../lib/db";
import { requireActiveLeader } from "../lib/auth";
import { revalidatePath } from "next/cache";

const cleanStr = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

const toEnglishDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
   .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

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

// ثبت پرداخت مسافر (فقط توسط خود لیدرِ همان مسافر)
export async function savePassengerPayment(formData: FormData, pathName: string) {
  try {
    // 🔒 فقط لیدر واردشده و فعال
    const auth = await requireActiveLeader();
    if (!auth.ok) return { success: false, message: "دسترسی غیرمجاز." };

    const passengerId = cleanStr(formData.get("passengerId"), 64);
    if (!passengerId) return { success: false, message: "شناسه مسافر نامعتبر است." };

    // 🔒 مسافر باید متعلق به همین لیدر باشد (جلوگیری از IDOR)
    const existing = await prisma.passenger.findFirst({
      where: { id: passengerId, leaderId: auth.leader.id },
      select: { id: true },
    });
    if (!existing) return { success: false, message: "مسافر یافت نشد." };

    const paymentStatus = cleanStr(formData.get("paymentStatus"), 40);
    const amountDigits = toEnglishDigits(cleanStr(formData.get("amount"), 20)).replace(/\D/g, '').slice(0, 12);
    const receiptDate = cleanStr(formData.get("receiptDate"), 20);

    // فیش: فقط لینک Cloudinary. آپلود مستقیم فایل روی دیسک سرور حذف شد (آسیب‌پذیر بود)
    const receipt = formData.get("receiptImage");
    let receiptImage: string | undefined;
    if (typeof receipt === 'string' && receipt.trim()) {
      const url = cleanImageUrl(receipt);
      if (!url) return { success: false, message: "لینک تصویر فیش نامعتبر است." };
      receiptImage = url;
    } else if (receipt && typeof receipt !== 'string' && (receipt as File).size > 0) {
      return { success: false, message: "ابتدا تصویر را از طریق آپلود امن ارسال کنید و لینک آن را بفرستید." };
    }

    // ذخیره یا بروزرسانی اطلاعات در دیتابیس Prisma
    await prisma.passenger.update({
      where: { id: existing.id },
      data: {
        ...(paymentStatus ? { paymentStatus } : {}),
        amount: amountDigits || null,
        receiptDate: receiptDate || null,
        ...(receiptImage ? { receiptImage } : {}),
      },
    });

    if (pathName && pathName.startsWith('/')) revalidatePath(pathName);
    return { success: true, message: "اطلاعات پرداخت و فیش با موفقیت در دیتابیس ثبت شد." };
  } catch (error) {
    console.error("Payment Save Error:", error);
    return { success: false, message: "خطا در ثبت اطلاعات پرداخت در دیتابیس." };
  }
}