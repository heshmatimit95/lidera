import { prisma } from '../../../lib/db';
import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const authority = url.searchParams.get("Authority");
  const status = url.searchParams.get("Status");
  const leaderIdentifier = url.searchParams.get("leaderId");

  // خواندن اطلاعات مسافر از کوکی امن (با await برای Next.js جدید)
  const cookieStore = await cookies();
  const passengerCookie = cookieStore.get('pending_passenger_data');
  
  let passengerInfo = {
    fullName: "مسافر آنلاین",
    phone: "",
    nationalId: "",
    tourName: "تور گردشگری",
    amountInRial: 0
  };

  if (passengerCookie) {
    try {
      passengerInfo = JSON.parse(passengerCookie.value);
    } catch (e) {
      console.error("Error parsing passenger cookie", e);
    }
  }

  if (status !== "OK" || !authority) {
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
          amount: Number(passengerInfo.amountInRial),
          authority: authority,
        }),
      }
    );

    const data = await response.json();

    if (data.data && (data.data.code === 100 || data.data.code === 101)) {
      if (leader) {
        const amountInToman = Math.floor(Number(passengerInfo.amountInRial) / 10);

        // ثبت قطعی و ۱۰۰٪ واقعی اطلاعات مسافر در دیتابیس
        await prisma.passenger.create({
          data: {
            fullName: passengerInfo.fullName || "مسافر آنلاین",
            mobile: passengerInfo.phone || "",
            nationalId: passengerInfo.nationalId || "",
            tourName: passengerInfo.tourName || "تور گردشگری",
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