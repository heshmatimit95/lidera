import { prisma } from '../../../lib/db';
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const authority = url.searchParams.get("Authority");
  const status = url.searchParams.get("Status");
  const leaderIdentifier = url.searchParams.get("leaderId");
  
  // خواندن مستقیم اطلاعات مسافر از URL بازگشتی بانک
  const fullName = url.searchParams.get("fullName") || "مسافر آنلاین";
  const phone = url.searchParams.get("phone") || "";
  const nationalId = url.searchParams.get("nationalId") || "";
  const tourName = url.searchParams.get("tourName") || "تور گردشگری";
  const amountInRial = Number(url.searchParams.get("amount") || 0);

  if (status !== "OK" || !authority) {
    const fallbackSlug = leaderIdentifier || 'leader_1';
    return NextResponse.redirect(`https://lidera.ir/?slug=${fallbackSlug}&payment=canceled`);
  }

  try {
    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: leaderIdentifier || "" }, { slug: leaderIdentifier || "" }] },
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
          amount: amountInRial,
          authority: authority,
        }),
      }
    );

    const data = await response.json();

    if (data.data && (data.data.code === 100 || data.data.code === 101)) {
      if (leader) {
        const amountInToman = Math.floor(amountInRial / 10);

        // ثبت قطعی اطلاعات واقعی مسافر در دیتابیس
        await prisma.passenger.create({
          data: {
            fullName: decodeURIComponent(fullName),
            mobile: phone,
            nationalId: nationalId,
            tourName: decodeURIComponent(tourName),
            paymentStatus: "پرداخت شده آنلاین",
            amount: `${amountInToman.toLocaleString('fa-IR')} تومان`,
            receiptDate: new Date().toLocaleDateString('fa-IR'),
            leaderId: leader.id,
            tenantId: leader.id,
          },
        });

        return NextResponse.redirect(`https://lidera.ir/?slug=${leader.slug || leaderIdentifier}&payment=success`);
      }
    }

    const fallbackSlug = leaderIdentifier || 'leader_1';
    return NextResponse.redirect(`https://lidera.ir/?slug=${fallbackSlug}&payment=failed`);
  } catch (error) {
    console.error("Verification Error:", error);
    const fallbackSlug = leaderIdentifier || 'leader_1';
    return NextResponse.redirect(`https://lidera.ir/?slug=${fallbackSlug}&payment=error`);
  }
}