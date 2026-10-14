'use server'
import { prisma } from "../lib/db";
import { writeFile } from "fs/promises";
import path from "path";

export async function uploadTourImages(formData: FormData) {
  const tourId = formData.get("tourId") as string;
  if (!tourId) return { success: false, message: "شناسه تور نامعتبر است." };

  const dataToUpdate: any = {};

  // چک کردن و ذخیره هر ۴ عکس
  for (let i = 1; i <= 4; i++) {
    const file = formData.get(`image${i}`) as File;
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const filename = `tour-${tourId}-img${i}-${Date.now()}${path.extname(file.name)}`;
      const uploadDir = path.join(process.cwd(), "public/uploads");
      
      await writeFile(path.join(uploadDir, filename), buffer);
      dataToUpdate[`image${i}`] = `/uploads/${filename}`;
    }
  }

  try {
    await prisma.tour.update({
      where: { id: tourId },
      data: dataToUpdate,
    });

    return { success: true, message: "عکس‌ها با موفقیت آپلود شدند." };
  } catch (error) {
    console.error("Upload Error:", error);
    return { success: false, message: "خطا در آپلود عکس‌ها" };
  }
}