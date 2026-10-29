import { prisma } from '../../../lib/db';
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const authority = url.searchParams.get("Authority");
  const status = url.searchParams.get("Status");
  const leaderIdentifier = url.searchParams.get("leaderId");
  const passengerId = url.searchParams.get("passengerId");
  const amountInRial = Number(url.searchParams.get("amount") || 0);

  const fallbackSlug = leaderIdentifier || 'leader_1';

  if (status !== "OK" || !authority) {
    return NextResponse.redirect(`https://lidera.ir/?slug=${fallbackSlug}&payment=canceled`);
  }

  try {
    const leader = await prisma.leader.findFirst({
      where: { OR: [{ id: leaderIdentifier || "" }, { slug: leaderIdentifier || "" }] },
    });

    if (!leader) {
      return NextResponse.redirect(`https://lidera.ir/?slug=${fallbackSlug}&payment=error`);
    }

    const ZARINPAL_MERCHANT =
      leader?.zarinpalMerchantId ||
      process.env.ZARINPAL_MERCHANT ||
      "00000000-0000-0000-0000-000000000000";

    const response = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/verify.json', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: ZARINPAL_MERCHANT,
        amount: amountInRial,
        authority: authority,
      }),
    });

    const data = await response.json();

    if (data.data && (data.data.code === 100 || data.data.code === 101)) {
      if (passengerId) {
        await prisma.passenger.update({
          where: { id: passengerId },
          data: { paymentStatus: "پرداخت شده آنلاین" },
        }).catch(() => {});
      }

      // بازگشت دقیق به لینک ادمین (همان ساختار `/?slug=...`) همراه با پارامتر موفقیت
      return NextResponse.redirect(`https://lidera.ir/?slug=${leader.slug || fallbackSlug}&payment=success`);
    }

    return NextResponse.redirect(`https://lidera.ir/?slug=${fallbackSlug}&payment=failed`);
  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.redirect(`https://lidera.ir/?slug=${fallbackSlug}&payment=error`);
  }
}