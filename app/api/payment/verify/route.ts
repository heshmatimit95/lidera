import { prisma } from '../../../lib/db';
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authority = url.searchParams.get("Authority");
  const status = url.searchParams.get("Status");

  // دریافت اطلاعات مسافر که از callback_url پاس داده شده بود
  const leaderIdentifier = url.searchParams.get("leaderId");
  const fullName = url.searchParams.get("fullName");
  const phone = url.searchParams.get("phone");
  const nationalId = url.searchParams.get("nationalId");
  const tourName = url.searchParams.get("tourName");
  const amountInRial = url.searchParams.get("amount"); // مبلغ به ریال

  if (status !== "OK" || !authority || !amountInRial) {
    return NextResponse.redirect(new URL("/payment-failed", request.url));
  }

  try {
    // پیدا کردن لیدر جهت دریافت Merchant اختصاصی (در صورت وجود در پلن طلایی)
    const leader = await prisma.leader.findFirst({
      where: {
        OR: [{ id: leaderIdentifier || "" }, { slug: leaderIdentifier || "" }],
      },
    });

    const ZARINPAL_MERCHANT =
      leader?.zarinpalMerchantId ||
      process.env.ZARINPAL_MERCHANT ||
      "YOUR_MERCHANT_ID";

    // تایید تراکنش با زرین‌پال (Sandbox / Production)
   const response = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/verify.json', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: ZARINPAL_MERCHANT,
          amount: Number(amountInRial),
          authority: authority,
        }),
      }
    );

    const data = await response.json();

    // کد ۱۰۰ یعنی پرداخت موفق و کد ۱۰۱ یعنی قبلاً تایید شده
    if (data.data && (data.data.code === 100 || data.data.code === 101)) {
      if (leaderIdentifier && fullName && phone && nationalId && tourName && leader) {
        
        // محاسبه مبلغ به تومان برای ذخیره یکدست در دیتابیس
        const amountInToman = Math.floor(Number(amountInRial) / 10);

        // ثبت اتوماتیک مسافر در دیتابیس پس از پرداخت موفق
        await prisma.passenger.create({
          data: {
            fullName,
            mobile: phone,
            nationalId,
            tourName,
            paymentStatus: "پرداخت شده آنلاین",
            amount: `${amountInToman.toLocaleString('fa-IR')} تومان`,
            receiptDate: new Date().toLocaleDateString('fa-IR'),
            leaderId: leader.id,
            tenantId: leader.id,
          },
        });

        // هدایت مستقیم مسافر به پنل لیدر با پیغامی موفقیت‌آمیز
        return NextResponse.redirect(
          new URL(`/leader?slug=${leaderIdentifier}&success=true`, request.url)
        );
      }
    }

    return NextResponse.redirect(new URL("/payment-failed", request.url));
  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.redirect(new URL("/payment-failed", request.url));
  }
}