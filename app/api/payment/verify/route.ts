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

  // در محیط سندباکس تست، اگر پرداخت ناموفق بود به صفحه اصلی لیدر با پارامتر خطا برمی‌گردیم
  if (status !== "OK" || !authority || !amountInRial) {
    const fallbackSlug = leaderIdentifier || 'leader_1';
    return NextResponse.redirect(
      new URL(`/?slug=${fallbackSlug}&payment=canceled`, request.url)
    );
  }

  try {
    // پیدا کردن لیدر بر اساس slug یا id
    const leader = await prisma.leader.findFirst({
      where: {
        OR: [{ id: leaderIdentifier || "" }, { slug: leaderIdentifier || "" }],
      },
    });

    const ZARINPAL_MERCHANT =
      leader?.zarinpalMerchantId ||
      process.env.ZARINPAL_MERCHANT ||
      "00000000-0000-0000-0000-000000000000";

    // تایید تراکنش با زرین‌پال (Sandbox)
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
      if (leader) {
        // محاسبه مبلغ به تومان برای ذخیره یکدست در دیتابیس
        const amountInToman = Math.floor(Number(amountInRial) / 10);

// ثبت دقیق اطلاعات واقعی مسافر در دیتابیس Prisma پس از پرداخت موفق
        await prisma.passenger.create({
          data: {
            fullName: fullName || "مشتری لیدرا",
            mobile: phone || "",
            nationalId: nationalId || "",
            tourName: tourName || "تور گردشگری",
            paymentStatus: "پرداخت شده آنلاین",
            amount: `${amountInToman.toLocaleString('fa-IR')} تومان`,
            receiptDate: new Date().toLocaleDateString('fa-IR'),
            leaderId: leader.id,
            tenantId: leader.id,
          },
        });

        // هدایت مستقیم و موفقیت‌آمیز مسافر به صفحه اختصاصی لیدر در lidera.ir
// هدایت مستقیم و موفقیت‌آمیز مسافر به دامنه اصلی لیدرا
        return NextResponse.redirect(
          `https://lidera.ir/?slug=${leader.slug || leaderIdentifier}&payment=success`
        );
      }
    }

    // اگر تایید درگاه موفق نبود
    const fallbackSlug = leaderIdentifier || 'leader_1';
return NextResponse.redirect(
      `https://lidera.ir/?slug=${leaderIdentifier || 'leader_1'}&payment=canceled`
    );
  } catch (error) {
    console.error("Verification Error:", error);
    const fallbackSlug = leaderIdentifier || 'leader_1';
    return NextResponse.redirect(
      new URL(`/?slug=${fallbackSlug}&payment=error`, request.url)
    );
  }
}