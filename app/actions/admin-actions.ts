'use server'

import { prisma } from "../lib/db";
import { revalidatePath } from "next/cache";

export async function getLeadersFromDb() {
  return await prisma.leader.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createLeaderInDb(data: any, pathName: string) {
  const username = data.username ? data.username.trim() : "";
  const nationalId = (data.nationalCode || data.nationalId || "").toString().trim();
  const mobile = (data.phone || data.mobile || "").toString().trim();

  if (username) {
    const existingUser = await prisma.leader.findFirst({
      where: {
        OR: [
          ...(username ? [{ username }] : []),
          ...(nationalId ? [{ nationalId }] : []),
          ...(mobile ? [{ mobile }] : [])
        ]
      }
    });

    if (existingUser) {
      return { 
        success: false, 
        message: "خطا: نام کاربری، کد ملی یا شماره موبایل وارد شده تکراری است و قبلاً ثبت شده است." 
      };
    }
  }

  const uniqueSlug = username ? username : `leader-${username || 'user'}`;
const newLeader = await prisma.leader.create({
  data: {
    slug: data.slug || uniqueSlug,
    fullName: data.fullName || "",
    username: username,
    nationalId: nationalId,
    mobile: mobile,
    address: data.address || "",
    password: data.password || "123456",
    status: "ACTIVE",
    // اضافه‌شدن شبکه‌های اجتماعی برای ذخیره در دیتابیس:
    instagram: data.instagram || "",
    telegram: data.telegram || "",
    rubika: data.rubika || "",
    whatsapp: data.whatsapp || "",
  },
});
  
  revalidatePath(pathName);
  return { success: true, data: newLeader, message: "لیدر با موفقیت ثبت شد." };
}

export async function updateLeaderInDb(leader: any, pathName: string) {
  await prisma.leader.update({
    where: { id: leader.id },
    data: {
      fullName: leader.fullName,
      username: leader.username,
      nationalId: leader.nationalId?.toString(),
      mobile: leader.mobile?.toString(),
      address: leader.address,
      instagram: leader.instagram,
      telegram: leader.telegram,
      whatsapp: leader.whatsapp,
      rubika: leader.rubika,
    },
    
  });
  revalidatePath(pathName);
  return { success: true, message: "" };
}

export async function deleteLeaderFromDb(id: string, pathName: string) {
  await prisma.$transaction([
    prisma.passenger.deleteMany({ where: { leaderId: id } }),
    prisma.tour.deleteMany({ where: { tenantId: id } }),
    prisma.leader.delete({ where: { id } }),
  ]);
  revalidatePath(pathName);
  return { success: true, message: "" };
}

export async function deleteAllRecordsForLeader(tenantSlug: string, pathName: string) {
  try {
    const leader = await prisma.leader.findFirst({
      where: { slug: tenantSlug }
    });

    if (leader) {
      await prisma.passenger.deleteMany({
        where: { leaderId: leader.id }
      });
    }

    revalidatePath(pathName);
    return { success: true, message: "تمامی مسافران با موفقیت از دیتابیس حذف شدند." };
  } catch (error) {
    console.error("Delete All Error:", error);
    return { success: false, message: "خطا در حذف رکوردها از دیتابیس." };
  }
}

export async function updateLeaderStatusInDb(id: string, status: string, pathName: string) {
  await prisma.leader.update({ where: { id }, data: { status } });
  revalidatePath(pathName);
  return { success: true, message: "" };
}

export async function updatePassword(id: string, newPassword: string, pathName: string) {
  await prisma.leader.update({ where: { id }, data: { password: newPassword } });
  revalidatePath(pathName);
  return { success: true, message: "" };
}

export async function updateAdminPassword(newPass: string, pathName: string) {
  revalidatePath(pathName);
  return { success: true, message: "" };
}

export async function resetLeaderPasswordInDb(id: string, pathName: string) {
  await prisma.leader.update({ where: { id }, data: { password: "123456" } });
  revalidatePath(pathName);
  return { success: true, message: "" };
}

export async function deleteSingleRecord(id: string, modelName: string, pathName: string) {
  try {
    if (modelName === 'passenger') {
      await prisma.passenger.delete({ where: { id } });
    } else if (modelName === 'tour') {
      await prisma.tour.delete({ where: { id } });
    } else {
      await prisma.leader.delete({ where: { id } });
    }
    revalidatePath(pathName);
    return { success: true, message: "" };
  } catch (error) {
    console.error("Delete Record Error:", error);
    return { success: false, message: "خطا در حذف رکورد." };
  }
}

export async function deletesSingleRecord(id: string, modelName: string, pathName: string) {
  return await deleteSingleRecord(id, modelName, pathName);
}

// === توابع جدید مربوط به مدیریت و ثبت تورها و گالری تصاویر ===

export async function getToursByLeader(tenantSlug: string) {
  try {
    const leader = await prisma.leader.findFirst({
      where: { OR: [{ slug: tenantSlug }, { id: tenantSlug }] }
    });
    if (!leader) return [];

    return await prisma.tour.findMany({
      where: { tenantId: leader.id },
      orderBy: { id: 'desc' }
    });
  } catch (error) {
    console.error("Error fetching tours:", error);
    return [];
  }
}

export async function saveTourAction(data: { name: string; title?: string; date?: string; price?: string; images: string[]; tenantId: string }, pathName: string) {
  try {
    await prisma.tour.create({
      data: {
        name: data.name,
        title: data.title || data.name,
        date: data.date || "",
        price: data.price || "",
        images: data.images || [],
        tenantId: data.tenantId,
        leader: {
          connect: { id: data.tenantId } // یا اگر tenantId همان slug است، از findFirst استفاده کن
        }
      }
    });
    revalidatePath(pathName);
    return { success: true, message: "تور با موفقیت ثبت شد." };
  } catch (error) {
    console.error("Error saving tour:", error);
    return { success: false, message: "خطا در ذخیره تور در دیتابیس." };
  }
}

// ========================================================

export async function submitPassengerAction(data: any) {
  try {
    const leaderKey = data.leaderSlug || data.tenantId;
    
    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: leaderKey }, { slug: leaderKey }, { username: leaderKey }] }
    });

    if (!leader) {
      return { success: false, message: 'تورلیدر مورد نظر یافت نشد.' };
    }

    const { leaderSlug, tenantId, ...passengerData } = data;

    await prisma.passenger.create({ 
      data: { 
        fullName: passengerData.fullName,
        mobile: passengerData.mobile,
        nationalId: passengerData.nationalId || null,
        tourName: passengerData.tourName,
        seatsCount: parseInt(data.seatsCount || '1', 10),
        idCardImage: passengerData.idCardImage || null,
        receiptImage: passengerData.receiptImage || null,
        tenantId: leader.slug,
        leader: {
          connect: { id: leader.id }
        }
      } 
    });

    return { success: true, message: "" };
  } catch (error) {
    console.error("Error creating passenger:", error);
    return { success: false, message: "خطا در ذخیره اطلاعات در دیتابیس." };
  }
}

export async function loginLeaderAction(username: string, pass: string) {
  const leader = await prisma.leader.findFirst({ where: { username: username.trim() } });
  if (!leader || leader.password !== pass) {
    return { success: false, message: 'اطلاعات اشتباه است', status: '' };
  }
  return { success: true, leaderKey: leader.id, status: leader.status, message: "" };
}

export async function loginAdminAction(username: string, pass: string) {
  try {
    const cleanUser = String(username || '').trim();
    const cleanPass = String(pass || '').trim();

    if ((cleanUser === 'admin56' || cleanUser === 'admin') && cleanPass === 'admin5656') {
      return { success: true, message: "ورود موفقیت‌آمیز ادمین کل" };
    }

    return { success: false, message: 'نام کاربری یا رمز عبور ادمین اشتباه است.' };
  } catch (error) {
    console.error('Admin Login Error:', error);
    return { success: false, message: 'خطای سرور در ورود ادمین.' };
  }
}

export async function deleteAllRecords(pathName: string) {
  try {
    await prisma.passenger.deleteMany({});
    await prisma.tour.deleteMany({});
    await prisma.leader.deleteMany({});

    revalidatePath(pathName);
    return { success: true, message: "کلیه اطلاعات با موفقیت از دیتابیس پاک شدند." };
  } catch (error) {
    console.error("Delete All Error:", error);
    return { success: false, message: "خطا در حذف اطلاعات از دیتابیس." };
  }
}