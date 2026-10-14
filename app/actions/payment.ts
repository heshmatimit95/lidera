'use server'

import { prisma } from "../lib/db";
import { redirect } from "next/navigation";

export async function startPayment(formData: {
  amount: number; // مبلغ به تومان
  description: string;
  leaderId: string;
  fullName: string;
  mobile: string;
  nationalId: string;
  tourName: string;
}) {
  const ZARINPAL_MERCHANT = process.env.ZARINPAL_MERCHANT || "YOUR_MERCHANT_ID";
  // اگر درگاه سندباکس (تست) باشد true و برای واقعی false است
  const isSandbox = true; 
  
  const baseURL = isSandbox 
    ? "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
    : "https://api.zarinpal.com/pg/v4/payment/request.json";

  try {
    const response = await fetch(baseURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: ZARINPAL_MERCHANT,
        amount: formData.amount, // تومان
        description: formData.description,
        callback_url: `http://localhost:3000/api/payment/verify?leaderId=${formData.leaderId}&fullName=${formData.fullName}&phone=${formData.mobile}&nationalId=${formData.nationalId}&tourName=${formData.tourName}&amount=${formData.amount}`,
        metadata: { mobile: formData.mobile }
      }),
    });

    const data = await response.json();

    if (data.data && data.data.code === 100) {
      // هدایت کاربر به صفحه پرداخت بانک
      const gatewayURL = isSandbox
        ? `https://sandbox.zarinpal.com/pg/StartPay/${data.data.authority}`
        : `https://www.zarinpal.com/pg/StartPay/${data.data.authority}`;
      
      redirect(gatewayURL);
    } else {
      throw new Error("خطا در اتصال به درگاه پرداخت");
    }
  } catch (error: any) {
    // خطای ریدایرکت Next.js طبیعی است و نباید لاگ خطا شود
    if (error.message === "NEXT_REDIRECT") throw error;
    console.error("Payment Error:", error);
    return { success: false, message: "خطایی در ارتباط با درگاه رخ داد." };
  }
}