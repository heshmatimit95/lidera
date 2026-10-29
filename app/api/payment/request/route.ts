import { prisma } from '../../../lib/db';
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const authority = url.searchParams.get("Authority");
  const status = url.searchParams.get("Status");
  const leaderIdentifier = url.searchParams.get("leaderId");
  const passengerId = url.searchParams.get("passengerId");
  const amountInRial = Number(url.searchParams.get("amount") || 0);

  // اگر لیدر مشخص نبود، حتماً از leader_1 به عنوان مقدار مطمئن استفاده کن
  let targetSlug = 'leader_1';

  try {
    if (leaderIdentifier) {
      const leader = await prisma.leader.findFirst({
        where: { OR: [{ id: leaderIdentifier }, { slug: leaderIdentifier }] },
      });
      if (leader?.slug) {
        targetSlug = leader.slug;
      } else if (leader?.id) {
        targetSlug = leader.id;
      }
    }
  } catch (e) {
    console.error("Leader lookup error in verify:", e);
  }

  // لینک دقیق بازگشت با تضمین وجود slug
  const buildRedirectUrl = (paymentStatus: string) => {
    return `https://lidera.ir/?slug=${encodeURIComponent(targetSlug)}&payment=${paymentStatus}`;
  };

  if (status !== "OK" || !authority) {
    return NextResponse.redirect(buildRedirectUrl("canceled"));
  }

  try {
    const leaderObj = await prisma.leader.findFirst({
      where: { OR: [{ id: leaderIdentifier || "" }, { slug: leaderIdentifier || "" }] },
    });

    const ZARINPAL_MERCHANT =
      leaderObj?.zarinpalMerchantId ||
      process.env.ZARINPAL_MERCHANT ||
      "1c337482-1e50-11e9-a417-005056a205be";

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

      return NextResponse.redirect(buildRedirectUrl("success"));
    }

    return NextResponse.redirect(buildRedirectUrl("failed"));
  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.redirect(buildRedirectUrl("error"));
  }
}