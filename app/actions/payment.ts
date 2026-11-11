'use server'

// 🔒 این تابع غیرفعال شد: مبلغ را از کلاینت می‌گرفت، آدرس بازگشتش localhost بود و
// اطلاعات شخصی مسافر را در URL می‌گذاشت. پرداخت آنلاین اکنون فقط از مسیر امن
// /api/payment/request انجام می‌شود (مبلغ و تأیید پرداخت سمت سرور).
export async function startPayment(_formData: {
  amount: number;
  description: string;
  leaderId: string;
  fullName: string;
  mobile: string;
  nationalId: string;
  tourName: string;
}) {
  return { success: false, message: "این مسیر پرداخت غیرفعال شده است." };
}