'use server'

import { prisma } from "../lib/db";
import { revalidatePath } from "next/cache";
import { writeFile } from "fs/promises";
import path from "path";

// ثبت پرداخت مسافر (چه از طریق درگاه و چه آپلود فیش کارت به کارت)
export async function savePassengerPayment(formData: FormData, pathName: string) {
  try {
    const passengerId = formData.get("passengerId") as string;
    const paymentStatus = formData.get("paymentStatus") as string;
    const amount = formData.get("amount") as string;
    const receiptDate = formData.get("receiptDate") as string;
    const file = formData.get("receiptImage") as File;

    let imagePath = "";

    // اگر مسافر فیش واریزی آپلود کرده باشد، آن را روی سرور ذخیره می‌کنیم10
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `receipt-${passengerId}-${Date.now()}${path.extname(file.name)}`;
      const uploadDir = path.join(process.cwd(), "public/uploads");
      
      await writeFile(path.join(uploadDir, filename), buffer);
      imagePath = `/uploads/${filename}`;
    }

    // ذخیره یا بروزرسانی اطلاعات در دیتابیس Prisma
    await prisma.passenger.update({
      where: { id: passengerId },
      data: {
        paymentStatus: paymentStatus, // مثلاً "پرداخت شده" یا "در انتظار تایید"
        amount: amount ? String(amount) : null,
        receiptDate: receiptDate,
        ...(imagePath ? { receiptImage: imagePath } : {}),
      },
    });

    revalidatePath(pathName);
    return { success: true, message: "اطلاعات پرداخت و فیش با موفقیت در دیتابیس ثبت شد." };
  } catch (error) {
    console.error("Payment Save Error:", error);
    return { success: false, message: "خطا در ثبت اطلاعات پرداخت در دیتابیس." };
  }
}