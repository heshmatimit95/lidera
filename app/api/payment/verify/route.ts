import { prisma } from '../../../lib/db';
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authority = url.searchParams.get("Authority");
  const status = url.searchParams.get("Status");

  // دریافت پارامترهای مسافر و مبلغ از callbackUrl
  const leaderIdentifier = url.searchParams.get("leaderId");
  const fullName = url.searchParams.get("fullName");
  const phone = url.searchParams.get("phone");
  const nationalId = url.searchParams.get("nationalId");
  const tourName = url.searchParams.get("tourName");
  const amountInRial = url.searchParams.get("amount");

  console.log("CALLBACK PARAMS RECEIVED:", { leaderIdentifier, fullName, phone, nationalId, tourName, amountInRial });

  if (status !== "OK" || !authority || !amountInRial) {
    const fallbackSlug = leaderIdentifier || 'leader_1';
    return NextResponse.redirect(
      `https://lidera.ir/?slug=${fallbackSlug}&payment=canceled`
    );
  }

  try {
    const leader = await prisma.leader.findFirst({
      where: {
        OR: [{ id: leaderIdentifier || "" }, { slug: leaderIdentifier || "" }],
      },
    });

    const ZARINPAL_MERCHANT =
      leader?.zarinpalMerchantId ||
      process.env.ZARINPAL_MERCHANT ||
      "00000000-0000-0000-0000-000000000000";

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

    if (data.data && (data.data.code === 100 || data.data.code === 101)) {
      if (leader) {
        const amountInToman = Math.floor(Number(amountInRial) / 10);

        // ثبت دقیق اطلاعات واقعی دریافتی در دیتابیس
        await prisma.passenger.create({
          data: {
            fullName: fullName ? decodeURIComponent(fullName) : "مسافر آنلاین",
            mobile: phone || "",
            nationalId: nationalId || "",
            tourName: tourName ? decodeURIComponent(tourName) : "تور گردشگری",
            paymentStatus: "پرداخت شده آنلاین",
            amount: `${amountInToman.toLocaleString('fa-IR')} تومان`,
            receiptDate: new Date().toLocaleDateString('fa-IR'),
            leaderId: leader.id,
            tenantId: leader.id,
          },
        });


        return NextResponse.redirect(
          `https://lidera.ir/?slug=${leader.slug || leaderIdentifier}&payment=success`
        );
      }
    }

    
    const fallbackSlug = leaderIdentifier || 'leader_1';
    return NextResponse.redirect(
      `https://lidera.ir/?slug=${fallbackSlug}&payment=failed`
    );
  } catch (error) {
    console.error("Verification Error:", error);
    const fallbackSlug = leaderIdentifier || 'leader_1';
    return NextResponse.redirect(
      `https://lidera.ir/?slug=${fallbackSlug}&payment=error`
    );
  }
}