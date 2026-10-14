import { prisma } from '../../../lib/db';
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authority = url.searchParams.get("Authority");
  const status = url.searchParams.get("Status");

  // اطلاعات مسافر که از طریق callback_url پاس داده بودیم
  const leaderIdentifier = url.searchParams.get("leaderId"); // می‌تواند slug یا id باشد
  const fullName = url.searchParams.get("fullName");
  const phone = url.searchParams.get("phone");
  const nationalId = url.searchParams.get("nationalId");
  const tourName = url.searchParams.get("tourName");
  const amount = url.searchParams.get("amount");

  if (status !== "OK" || !authority) {
    return NextResponse.redirect(new URL("/payment-failed", request.url));
  }

  const ZARINPAL_MERCHANT = process.env.ZARINPAL_MERCHANT || "YOUR_MERCHANT_ID";

  try {
    // تایید تراکنش با زرین‌پال
    const response = await fetch("https://sandbox.zarinpal.com/pg/v4/payment/verify.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: ZARINPAL_MERCHANT,
        amount: Number(amount),
        authority: authority,
      }),
    });

    const data = await response.json();

    if (data.data && (data.data.code === 100 || data.data.code === 101)) {
      if (leaderIdentifier && fullName && phone && nationalId && tourName) {
        // ⭐ پیدا کردن لیدر واقعی در دیتابیس برای جلوگیری از خطای کلید خارجی
        const leader = await prisma.leader.findFirst({
          where: { OR: [{ id: leaderIdentifier }, { slug: leaderIdentifier }] }
        });

        if (leader) {
          await prisma.passenger.create({
            data: {
              fullName,
              mobile: phone, 
              nationalId,
              tourName,
              paymentStatus: "پرداخت شده", 
              amount: `${amount} تومان`,
              receiptDate: new Date().toLocaleDateString('fa-IR'),
              leaderId: leader.id, // استفاده از ID اصلی دیتابیس
              tenantId: leader.id,
            },
          });
        }
      }

      // هدایت صحیح به پنل تورلیدر
      return NextResponse.redirect(new URL(`/leader?slug=${leaderIdentifier}&success=true`, request.url));
    } else {
      return NextResponse.redirect(new URL("/payment-failed", request.url));
    }
  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.redirect(new URL("/payment-failed", request.url));
  }
}