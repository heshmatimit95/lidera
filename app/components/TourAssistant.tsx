'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';

// دستیار پاسخ‌گوی تور: از روی اطلاعات همان تور (قیمت، هتل، حمل‌ونقل، خدمات) جواب می‌دهد.
// بدون API خارجی و بدون هزینه؛ از داخل ایران هم کار می‌کند. چیزی را از خودش نمی‌سازد.

type Msg = { from: 'bot' | 'me'; text: string };

const RED = '#E5383B';
const RED_DARK = '#C92A2D';

const toEn = (s: any) =>
  String(s ?? '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
const norm = (s: string) =>
  toEn(s).replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[‌‏‎]/g, ' ').replace(/\s+/g, ' ').toLowerCase().trim();
const has = (q: string, words: string[]) => words.some((w) => q.includes(w));
const toNum = (v: any) => {
  const d = toEn(v).replace(/[^0-9]/g, '');
  return d ? Number(d) : 0;
};
const money = (n: number) => n.toLocaleString('fa-IR') + ' تومان';
const fa = (n: number) => n.toLocaleString('fa-IR');

const GREETING = 'سلام! من دستیار پاسخ‌گوی این تور هستم. قیمت، هتل، حمل‌ونقل، خدمات و مراحل ثبت‌نام را از روی اطلاعات ثبت‌شده‌ی همین تور جواب می‌دهم.';

const BASE_SUGGESTIONS = [
  'قیمت تور چقدر است؟',
  'هتل‌ها چه تفاوتی دارند؟',
  'حمل‌ونقل چطور است؟',
  'خدمات تور شامل چیست؟',
  'تاریخ و مدت تور؟',
  'چطور ثبت‌نام کنم؟',
  'روش پرداخت چیست؟',
];

type Intent = 'hotel' | 'transport' | 'date' | 'price' | 'services' | 'register' | 'pay' | 'cheap' | 'calc' | 'contact' | 'other';

// پیشنهاد بعدی بر اساس موضوعِ آخرین پاسخ
const FOLLOW: Record<Intent, string[]> = {
  price: ['ارزان‌ترین حالت چقدر است؟', 'هتل‌ها چه تفاوتی دارند؟', 'روش پرداخت چیست؟'],
  cheap: ['هتل‌ها چه تفاوتی دارند؟', 'حمل‌ونقل چطور است؟', 'چطور ثبت‌نام کنم؟'],
  calc: ['روش پرداخت چیست؟', 'چطور ثبت‌نام کنم؟', 'خدمات تور شامل چیست؟'],
  hotel: ['قیمت تور چقدر است؟', 'ارزان‌ترین حالت چقدر است؟', 'حمل‌ونقل چطور است؟'],
  transport: ['قیمت تور چقدر است؟', 'تاریخ و مدت تور؟', 'خدمات تور شامل چیست؟'],
  date: ['قیمت تور چقدر است؟', 'خدمات تور شامل چیست؟', 'چطور ثبت‌نام کنم؟'],
  services: ['قیمت تور چقدر است؟', 'هتل‌ها چه تفاوتی دارند؟', 'چطور ثبت‌نام کنم؟'],
  register: ['روش پرداخت چیست؟', 'قیمت تور چقدر است؟', 'تماس با لیدر'],
  pay: ['چطور ثبت‌نام کنم؟', 'قیمت تور چقدر است؟', 'تماس با لیدر'],
  contact: ['قیمت تور چقدر است؟', 'چطور ثبت‌نام کنم؟'],
  other: BASE_SUGGESTIONS.slice(0, 4),
};

const REGISTER_TEXT =
  'مراحل ثبت‌نام:\n' +
  '۱. مشخصات خود (نام، موبایل، کد ملی، تاریخ تولد) را وارد کنید.\n' +
  '۲. تصویر کارت ملی را بارگذاری کنید.\n' +
  '۳. هتل و حمل‌ونقل را انتخاب کنید؛ مبلغ نهایی خودکار نمایش داده می‌شود.\n' +
  '۴. تعهدنامه را بپذیرید و روش پرداخت را انتخاب کنید.\n' +
  '۵. بعد از ثبت، لیدر پرداخت شما را بررسی و تأیید می‌کند.';

function answer(raw: string, tour: any, leader: any): { text: string; intent: Intent } {
  const q = norm(raw);
  const leaderName = leader?.fullName || leader?.name || 'لیدر';
  const phone = String(leader?.phone || leader?.mobile || '').trim();

  if (has(q, ['سلام', 'درود', 'وقت بخیر']) && q.length < 15) {
    return { text: 'سلام! درباره‌ی قیمت، هتل، حمل‌ونقل، خدمات، تاریخ یا روش ثبت‌نام همین تور بپرسید.', intent: 'other' };
  }
  if (has(q, ['تماس', 'شماره', 'تلفن', 'پشتیبان', 'واتساپ', 'تلگرام', 'با لیدر'])) {
    return {
      text: phone ? `برای هماهنگی مستقیم با ${leaderName} تماس بگیرید: ${toEn(phone)}` : `برای هماهنگی مستقیم، از راه‌های ارتباطی ${leaderName} که در همین صفحه آمده استفاده کنید.`,
      intent: 'contact',
    };
  }
  if (!tour) return { text: 'ابتدا از فرم، تور مورد نظرتان را انتخاب کنید تا درباره‌اش جواب بدهم.', intent: 'other' };

  const title = tour.title || tour.name || 'این تور';
  const base = toNum(tour.price);
  const hotels: any[] = Array.isArray(tour.hotels) ? tour.hotels : [];
  const transports: any[] = Array.isArray(tour.transports) ? tour.transports : [];
  const services: string[] = Array.isArray(tour.services) ? tour.services : [];

  // اسم هتل یا گزینه‌ی حمل‌ونقل در متن سؤال؟
  const hotelHit = hotels.find((h) => h?.name && q.includes(norm(String(h.name))));
  const transHit = transports.find((t) => t?.name && q.includes(norm(String(t.name))));

  // محاسبه‌ی مبلغ: «برای ۳ نفر…» یا وقتی هتل/حمل‌ونقل مشخص شده و واژه‌ی قیمت هست
  const seatsMatch = q.match(/(\d{1,2})\s*(نفر|نفره|مسافر)/);
  const wantsCalc = !!seatsMatch || ((hotelHit || transHit) && has(q, ['قیمت', 'چند', 'هزینه', 'مبلغ', 'میشه', 'می شود']));
  if (wantsCalc && base) {
    const seats = Math.min(50, Math.max(1, seatsMatch ? Number(seatsMatch[1]) : 1));
    const hMin = hotels.length ? Math.min(...hotels.map((h) => toNum(h.price))) : 0;
    const tMin = transports.length ? Math.min(...transports.map((t) => toNum(t.price))) : 0;
    const hPrice = hotelHit ? toNum(hotelHit.price) : hMin;
    const tPrice = transHit ? toNum(transHit.price) : tMin;
    const per = base + hPrice + tPrice;
    const lines = [`محاسبه برای ${fa(seats)} نفر:`, `• قیمت پایه: ${money(base)}`];
    if (hotels.length) lines.push(`• هتل ${hotelHit ? hotelHit.name : '(ارزان‌ترین گزینه)'}: ${hPrice ? money(hPrice) : 'بدون هزینه‌ی اضافه'}`);
    if (transports.length) lines.push(`• حمل‌ونقل ${transHit ? transHit.name : '(ارزان‌ترین گزینه)'}: ${tPrice ? money(tPrice) : 'بدون هزینه‌ی اضافه'}`);
    lines.push(`هر نفر: ${money(per)}`, `جمع کل: ${money(per * seats)}`);
    lines.push('مبلغ نهایی و قطعی را همان لحظه در پایین فرم می‌بینید.');
    return { text: lines.join('\n'), intent: 'calc' };
  }

  if (has(q, ['ارزان', 'اقتصادی', 'کمترین', 'کم هزینه', 'کمتر'])) {
    const hMin = hotels.length ? hotels.reduce((a, b) => (toNum(b.price) < toNum(a.price) ? b : a)) : null;
    const tMin = transports.length ? transports.reduce((a, b) => (toNum(b.price) < toNum(a.price) ? b : a)) : null;
    if (!base && !hMin && !tMin) return { text: 'قیمت این تور هنوز ثبت نشده است. از لیدر بپرسید.', intent: 'cheap' };
    const per = base + (hMin ? toNum(hMin.price) : 0) + (tMin ? toNum(tMin.price) : 0);
    return {
      text:
        'ارزان‌ترین حالت برای یک نفر:\n' +
        (hMin ? `• هتل: ${hMin.name}\n` : '') +
        (tMin ? `• حمل‌ونقل: ${tMin.name}\n` : '') +
        `مبلغ: ${money(per)}`,
      intent: 'cheap',
    };
  }

  if (has(q, ['گران', 'لوکس', 'بهترین', 'vip', 'ویژه']) && hotels.length) {
    const top = hotels.reduce((a, b) => (toNum(b.price) > toNum(a.price) ? b : a));
    return { text: `گران‌ترین (کامل‌ترین) هتل این تور: ${top.name} — ${toNum(top.price) ? money(toNum(top.price)) + ' اضافه به قیمت پایه' : 'بدون هزینه‌ی اضافه'}${top.description ? `\n${top.description}` : ''}`, intent: 'hotel' };
  }

  if (hotelHit) {
    return {
      text: `${hotelHit.name}: ${toNum(hotelHit.price) ? money(toNum(hotelHit.price)) + ' (هر نفر، اضافه به قیمت پایه)' : 'بدون هزینه‌ی اضافه'}${hotelHit.description ? `\n${hotelHit.description}` : ''}`,
      intent: 'hotel',
    };
  }
  if (transHit) {
    return {
      text: `${transHit.name}: ${toNum(transHit.price) ? money(toNum(transHit.price)) + ' (هر نفر، اضافه به قیمت پایه)' : 'بدون هزینه‌ی اضافه'}${transHit.description ? `\n${transHit.description}` : ''}`,
      intent: 'transport',
    };
  }

  if (has(q, ['هتل', 'اقامت', 'اتاق', 'ستاره'])) {
    if (hotels.length === 0) return { text: 'برای این تور هتلی ثبت نشده است. از لیدر بپرسید.', intent: 'hotel' };
    return {
      text:
        `هتل‌های ${title} (قیمت هر نفر، به قیمت پایه اضافه می‌شود):\n` +
        hotels.map((h) => `• ${h.name} — ${toNum(h.price) ? money(toNum(h.price)) : 'بدون هزینه‌ی اضافه'}${h.description ? ` (${h.description})` : ''}`).join('\n') +
        '\nهتل را در فرم ثبت‌نام انتخاب می‌کنید و مبلغ نهایی خودکار حساب می‌شود.',
      intent: 'hotel',
    };
  }

  if (has(q, ['حمل', 'قطار', 'هواپیما', 'پرواز', 'اتوبوس', 'ماشین', 'رفت و برگشت', 'ترانسفر', 'سفر با'])) {
    if (transports.length === 0 && !tour.transportType) return { text: 'نوع حمل‌ونقل برای این تور ثبت نشده است. از لیدر بپرسید.', intent: 'transport' };
    if (transports.length === 0) return { text: `حمل‌ونقل این تور: ${tour.transportType}.`, intent: 'transport' };
    return {
      text:
        `گزینه‌های حمل‌ونقل ${title}:\n` +
        transports.map((t) => `• ${t.name} — ${toNum(t.price) ? money(toNum(t.price)) + ' (اضافه به قیمت پایه)' : 'بدون هزینه‌ی اضافه'}${t.description ? ` (${t.description})` : ''}`).join('\n') +
        '\nیکی را هنگام ثبت‌نام انتخاب می‌کنید.',
      intent: 'transport',
    };
  }

  if (has(q, ['تاریخ', 'مدت', 'چند روز', 'چند شب', 'زمان', 'حرکت', 'برگشت', 'کی میریم', 'کی هست', 'کی برگزار'])) {
    const parts: string[] = [];
    if (tour.startDate || tour.endDate) parts.push(`تاریخ: ${tour.startDate || '؟'} تا ${tour.endDate || '؟'}`);
    else if (tour.date) parts.push(`تاریخ: ${tour.date}`);
    if (tour.duration) parts.push(`مدت: ${tour.duration}`);
    return { text: parts.length ? parts.join('\n') : 'تاریخ این تور ثبت نشده است. از لیدر بپرسید.', intent: 'date' };
  }

  if (has(q, ['قیمت', 'هزینه', 'چند', 'تومان', 'نرخ', 'پول', 'مبلغ'])) {
    const hMin = hotels.length ? Math.min(...hotels.map((h) => toNum(h.price))) : 0;
    const tMin = transports.length ? Math.min(...transports.map((t) => toNum(t.price))) : 0;
    let msg = base ? `قیمت پایه‌ی هر نفر: ${money(base)}.` : 'قیمت پایه‌ی این تور ثبت نشده است.';
    if (hotels.length || transports.length) {
      msg += `\nمبلغ نهایی = (قیمت پایه + هتل انتخابی + حمل‌ونقل انتخابی) × تعداد نفرات.`;
      if (base) msg += `\nکمترین حالت برای یک نفر: ${money(base + hMin + tMin)}.`;
      msg += '\nمی‌توانید بنویسید «برای ۳ نفر چقدر می‌شود؟» تا حساب کنم.';
    }
    return { text: msg + '\nمبلغ دقیق را در پایین فرم، همان لحظه که انتخاب می‌کنید، می‌بینید.', intent: 'price' };
  }

  if (has(q, ['خدمات', 'شامل', 'صبحانه', 'ناهار', 'شام', 'بیمه', 'گشت', 'راهنما', 'ورودی'])) {
    if (services.length === 0) return { text: 'لیدر هنوز خدماتی برای این تور ثبت نکرده است. از او بپرسید.', intent: 'services' };
    const hit = services.find((s) => has(q, [norm(String(s))]) );
    if (hit) return { text: `بله، «${hit}» جزو خدمات ثبت‌شده‌ی این تور است.`, intent: 'services' };
    return { text: `خدمات ${title}:\n` + services.map((s) => `• ${s}`).join('\n'), intent: 'services' };
  }

  if (has(q, ['ثبت نام', 'ثبتنام', 'رزرو', 'مدارک', 'کارت ملی', 'مراحل'])) {
    return { text: REGISTER_TEXT, intent: 'register' };
  }

  if (has(q, ['پرداخت', 'کارت', 'فیش', 'آنلاین', 'درگاه', 'واریز', 'بیعانه', 'قسط'])) {
    const m = leader?.paymentMethod;
    const how =
      m === 'gateway' ? 'پرداخت فقط به‌صورت آنلاین (درگاه بانکی) است.' :
      m === 'both' ? 'می‌توانید آنلاین (درگاه بانکی) یا کارت‌به‌کارت پرداخت کنید.' :
      'پرداخت به‌صورت کارت‌به‌کارت است؛ بعد از واریز، تصویر فیش را در فرم بارگذاری می‌کنید.';
    return { text: `${how}\nبعد از ثبت، ${leaderName} فیش را بررسی و وضعیت پرداخت شما را تأیید می‌کند. درباره‌ی بیعانه یا قسطی‌بودن مستقیم از او بپرسید.`, intent: 'pay' };
  }

  if (has(q, ['چطور', 'چگونه'])) return { text: REGISTER_TEXT, intent: 'register' };

  if (has(q, ['ظرفیت', 'جا دارد', 'صندلی', 'تخفیف', 'کودک', 'بچه', 'لغو', 'کنسل', 'استرداد'])) {
    return { text: `این مورد در اطلاعات تور ثبت نشده است. لطفاً مستقیم از ${leaderName} بپرسید.`, intent: 'contact' };
  }

  return { text: 'سؤال شما را دقیق متوجه نشدم. یکی از گزینه‌های پایین را بزنید، یا کوتاه‌تر بنویسید (مثلاً «هتل» یا «قیمت»). برای موارد دیگر با لیدر تماس بگیرید.', intent: 'other' };
}

export default function TourAssistant({ tour, leader }: { tour: any; leader: any }) {
  const tourKey = String(tour?.id || tour?.name || 'none');
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'bot', text: GREETING }]);
  const [intent, setIntent] = useState<Intent | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // با تغییر تور، گفتگوی قبلی بسته و پاک می‌شود (جواب‌های تور قبلی به تور جدید نچسبد)
  useEffect(() => {
    setOpen(false);
    setInput('');
    setIntent(null);
    setMsgs([{ from: 'bot', text: GREETING }]);
  }, [tourKey]);

  // فقط خودِ لیست پیام اسکرول شود، نه کل صفحه (scrollIntoView صفحه را می‌پراند و بزرگ می‌کرد)
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, open]);

  const suggestions = useMemo(() => (intent ? FOLLOW[intent] : BASE_SUGGESTIONS), [intent]);

  const ask = (text: string) => {
    const t = text.trim().slice(0, 300);
    if (!t) return;
    const r = answer(t, tour, leader);
    setMsgs((m): Msg[] => [...m, { from: 'me' as const, text: t }, { from: 'bot' as const, text: r.text }].slice(-40));
    setIntent(r.intent);
    setInput('');
  };

  return (
    <div dir="rtl">
      {open && (
        <div
          role="dialog"
          aria-label="دستیار پاسخ‌گوی تور"
         className="fixed bottom-24 left-3 right-3 z-50 flex h-[min(75dvh,540px)] flex-col overflow-hidden rounded-2xl border-2 bg-[#121214] text-white shadow-2xl sm:left-auto sm:w-96"
          style={{ borderColor: RED }}
        >
          {/* سربرگ */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b-2 bg-[#1a1a1e] px-4 py-3" style={{ borderColor: `${RED}80` }}>
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold" style={{ color: RED }}>دستیار پاسخ‌گوی تور</div>
              <div className="truncate text-[10px] text-zinc-400">{tour ? (tour.title || tour.name) : 'ابتدا تور را انتخاب کنید'}</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="بستن" className="cursor-pointer px-2 text-lg text-zinc-400 hover:text-white">✕</button>
          </div>

          {/* پیام‌ها: تنها بخش اسکرول‌شونده */}
          <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'me' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3 py-2 text-[12px] leading-6 ${
                    m.from === 'me' ? 'text-white' : 'border border-white/15 bg-[#1e1e22] text-zinc-100'
                  }`}
                  style={m.from === 'me' ? { background: RED } : undefined}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* گزینه‌های سریع: همیشه بالای ورودی و دیده‌شدنی */}
          <div className="flex shrink-0 gap-1.5 overflow-x-auto border-t border-white/10 px-3 py-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] hover:bg-white/10"
                style={{ borderColor: `${RED}b3`, color: '#ff8a8d', background: `${RED}1a` }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* ورودی */}
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex shrink-0 gap-2 border-t border-white/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={300}
              placeholder="سؤال خود را بنویسید..."
              className="min-w-0 flex-1 rounded-xl border-2 bg-black/40 px-3 py-2 text-base text-white outline-none sm:text-xs"
              style={{ borderColor: `${RED}b3` }}
            />
            <button type="submit" className="min-h-38px shrink-0 cursor-pointer rounded-xl px-4 text-xs font-bold text-white" style={{ background: RED }}>
              ارسال
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="دستیار پاسخ‌گوی تور"
        title="دستیار پاسخ‌گوی تور"
        className="fixed bottom-5 right-4 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-2 border-white text-white shadow-[3px_3px_0_rgba(18,18,20,.6)] transition-transform hover:scale-105 active:scale-95"
        style={{ background: open ? RED_DARK : RED }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M9 10h.01M12 10h.01M15 10h.01" />
        </svg>
      </button>
    </div>
  );
}