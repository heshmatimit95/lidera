import Link from 'next/link';

export const metadata = {
  title: 'لیدرا | ثبت‌نام مسافران تور',
  description:
    'برای هر تور یک لینک اختصاصی. مسافر هتل و حمل‌ونقل را انتخاب می‌کند، مبلغ خودکار حساب می‌شود و همه‌چیز در یک جدول جمع می‌شود.',
};
// رنگ‌های برند: نارنجی #F9704E، مشکی #121214، سفید
const INK = '#121214';

const MARQUEE = ['قطار', 'هواپیما', 'هتل', 'هوش مصنوعی', 'فیش واریزی', 'جدول مسافران', 'خروجی اکسل', 'لیست بیمه', 'تاریخ شمسی'];

const FEATURES = [
  {
    icon: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
    title: 'لینک اختصاصی برای هر تور',
    text: 'تورها، تصاویر، هتل‌ها و خدمات را یک‌بار تعریف می‌کنید و لینک را برای مسافران می‌فرستید.',
  },
  {
    icon: 'M4 17h16M6 17l1-9h10l1 9M9 8V5h6v3M8 21h2M14 21h2',
    title: 'هتل و حمل‌ونقل، انتخاب مسافر',
    text: 'قطار یا هواپیما، هتل سه یا چهار ستاره. هر گزینه قیمت خودش را دارد و مسافر قبل از ثبت‌نام جمع نهایی را می‌بیند.',
  },
  {
    icon: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 12h2M12 12h2M8 16h2M12 16h2',
    title: 'محاسبه‌ی خودکار و مطمئن',
    text: '(قیمت تور + هتل + حمل‌ونقل) × تعداد نفرات. مبلغ روی سرور حساب می‌شود و با دستکاری صفحه تغییر نمی‌کند.',
  },
  {
    icon: 'M3 5h18v14H3zM3 10h18M9 5v14',
    title: 'جدول مسافران و خروجی اکسل',
    text: 'جست‌وجو با نام، کد ملی و تور، فیلتر وضعیت پرداخت و بازه‌ی تاریخ شمسی. فایل اکسل با یک کلیک.',
  },
  {
    icon: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
    title: 'فیش و وضعیت پرداخت',
    text: 'مسافر تصویر فیش را بارگذاری می‌کند و شما وضعیت را ثبت می‌کنید: پرداخت‌شده، بیعانه یا در انتظار تأیید.',
  },
  {
    icon: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
    title: 'لیست بیمه، جدا و آماده',
    text: 'مسافرانی که بیمه دارند در یک فهرست جدا هستند و می‌توانید آن را هم به‌صورت اکسل بگیرید.',
  },
];

const AI_ADVANTAGES = [
  {
    badge: 'فعال',
    isSoon: false,
    icon: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
    title: 'دستیار هوشمند ساخت برنامه سفر',
    text: 'با وارد کردن مقصد و تعداد روزها، هوش مصنوعی برنامه سفر، پکیج‌ها و متن معرفی تور را در چند ثانیه آماده یا اصلاح می‌کند؛ همچنین متن را متناسب با کپشن شبکه‌های اجتماعی بازنویسی می‌کند. علاوه بر این، اگر هر سؤال دیگری (حتی غیر از سفر) داشتید، در بخش «از من بپرس» هوش مصنوعی به سؤالات شما پاسخ می‌دهد',
  },
  {
    badge: 'فعال',
    isSoon: false,
    icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM9 10h.01M15 10h.01',
    title: 'دستیار پاسخ‌گوی تور در فرم مسافر',
    text: 'مسافر درباره‌ی قیمت، هتل، حمل‌ونقل، خدمات و روش ثبت‌نام می‌پرسد و از روی اطلاعات همان تور جواب می‌گیرد؛ بدون پیام دادن به شما.',
  },
  {
    badge: 'فعال',
    isSoon: false,
    icon: 'M18 20V10M12 20V4M6 20v-6',
    title: 'تحلیل مالی هر تور',
    text: 'مبلغ وصول‌شده، بیعانه و معوق را ببینید، هزینه‌ها را وارد کنید و سود پیش‌بینی‌شده و تعداد نفر لازم برای سربه‌سر را بگیرید.',
  },
];

const STEPS = [
  { n: '۱', title: 'تور را بسازید', text: 'عنوان، قیمت پایه، هتل‌ها و گزینه‌های حمل‌ونقل را با قیمت هر کدام وارد کنید.' },
  { n: '۲', title: 'لینک را بفرستید', text: 'همان لینک اختصاصی را در شبکه‌های اجتماعی یا برای مشتری‌ها بفرستید.' },
  { n: '۳', title: 'جدول را ببینید', text: 'ثبت‌نام‌ها با انتخاب‌های هر مسافر جمع می‌شوند. فیش‌ها را تأیید کنید و اکسل بگیرید.' },
];

const ROWS = [
  { name: 'سارا احمدی', seats: '۱ نفر', hotel: 'هتل سه ستاره', transport: 'قطار ۴ تخته', amount: '۱۹٬۸۰۰٬۰۰۰', status: 'پرداخت شده', tone: 'bg-green-100 text-green-900' },
  { name: 'امیر کریمی', seats: '۲ نفر', hotel: 'هتل چهار ستاره', transport: 'هواپیما', amount: '۴۹٬۴۰۰٬۰۰۰', status: 'در انتظار تأیید فیش', tone: 'bg-amber-100 text-amber-900' },
  { name: 'نگار موسوی', seats: '۱ نفر', hotel: 'هتل سه ستاره', transport: 'هواپیما', amount: '۲۲٬۸۰۰٬۰۰۰', status: 'در انتظار پرداخت', tone: 'bg-zinc-200 text-zinc-800' },
];

// انیمیشن‌ها: CSS خالص و بدون جاوااسکریپت. اگر مرورگر پشتیبانی نکند، همه‌چیز ساکن و کامل دیده می‌شود.
const CSS = `
@keyframes ld-up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes ld-float{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-14px) rotate(1deg)}}
@keyframes ld-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes ld-spin{to{transform:rotate(360deg)}}
@keyframes ld-pulse{0%{transform:scale(.8);opacity:.8}100%{transform:scale(2.2);opacity:0}}
@keyframes ld-glow{0%,100%{box-shadow:6px 6px 0 #F9704E}50%{box-shadow:9px 9px 0 #F9704E}}
.ld-in{animation:ld-up .8s cubic-bezier(.2,.7,.2,1) both}
.ld-float{animation:ld-float 6s ease-in-out infinite}
.ld-marquee{animation:ld-marquee 30s linear infinite}
.ld-marquee:hover{animation-play-state:paused}
.ld-spin{animation:ld-spin 26s linear infinite}
.ld-pulse{animation:ld-pulse 1.8s ease-out infinite}
.ld-ai-card{animation:ld-glow 4s ease-in-out infinite}
@supports (animation-timeline: view()){
  .ld-reveal{animation:ld-up both linear;animation-timeline:view();animation-range:entry 0% entry 45%}
}
html{scroll-behavior:smooth}
@keyframes ld-show{from{opacity:0;transform:translateY(10px) scale(.85);pointer-events:none}to{opacity:1;transform:none;pointer-events:auto}}
@keyframes ld-hide{from{opacity:1;transform:none;pointer-events:auto}to{opacity:0;transform:translateY(-10px) scale(.85);pointer-events:none}}
@supports (animation-timeline: scroll()){
  .ld-up-btn{opacity:0;animation:ld-show both linear;animation-timeline:scroll(root block);animation-range:0px 320px}
  .ld-down-btn{animation:ld-hide both linear;animation-timeline:scroll(root block);animation-range:calc(100% - 320px) 100%}
}
@media (prefers-reduced-motion: reduce){
  html{scroll-behavior:auto}
  .ld-in,.ld-float,.ld-marquee,.ld-spin,.ld-pulse,.ld-reveal,.ld-ai-card{animation:none!important}
  .ld-up-btn,.ld-down-btn{animation:none!important;opacity:1!important;transform:none!important;pointer-events:auto!important}
}
`;

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default async function LandingPage({ searchParams }: { searchParams?: any }) {
  const sp = (await searchParams) || {};
  const rawSlug = Array.isArray(sp.slug) ? sp.slug[0] : sp.slug;
  const slug = rawSlug && /^[A-Za-z0-9_-]{1,64}$/.test(rawSlug) ? rawSlug : '';
  const loginHref = `/login?slug=${slug || 'leader_1'}`;
  const formHref = slug ? `/?slug=${slug}` : '';
  const sampleHref = formHref || '/?slug=leader_1';

  return (
    <div id="page-top" dir="rtl" className="min-h-screen overflow-x-hidden bg-[#F9704E] leading-8 text-[#121214]">
      <style>{CSS}</style>

      {/* ───────── بالای صفحه ───────── */}
      <div className="relative overflow-hidden">
        {/* تزئینات گرافیکی */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-100" style={{ backgroundImage: 'radial-gradient(rgba(18,18,20,.16) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
        <div aria-hidden="true" className="pointer-events-none absolute -left-28 top-24 h-80 w-80 rounded-full border-[3px] border-[#121214]/25" />
        <div aria-hidden="true" className="ld-spin pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full border-[3px] border-dashed border-[#121214]/40" />

        <header className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pt-6 sm:px-6">
          <img
            src="/logo.png"
            alt="Lidera Logo"
            className="h-14 sm:h-16 w-auto object-contain"
          />
          <nav className="flex flex-wrap items-center gap-3 text-base font-extrabold">
            <a
              href="#features"
              className="rounded-full bg-[#121214] px-5 py-2 text-white transition-all duration-300 hover:-translate-y-0.5 border-2 border-[#f3f0f0] shadow-md"
            >
              ویژگی‌ها
            </a>
            <a
              href="#ai-edge"
              className="rounded-full bg-[#121214] px-5 py-2 text-[#F9704E] transition-all duration-300 hover:-translate-y-0.5 border-2 border-[#f3f0f0] shadow-md"
            >
              ابزارهای هوشمند
            </a>
            <a
              href="#how"
              className="rounded-full bg-[#121214] px-5 py-2 text-white transition-all duration-300 hover:-translate-y-0.5 border-2 border-[#f3f0f0] shadow-md"
            >
              نحوه‌ی کار
            </a>
            <a
              href="#trust"
              className="rounded-full bg-[#121214] px-5 py-2 text-white transition-all duration-300 hover:-translate-y-0.5 border-2 border-[#f3f0f0] shadow-md"
            >
              امنیت
            </a>
            {formHref && (
              <Link
                href={formHref}
                className="rounded-full bg-white px-5 py-2 text-[#121214] transition-all duration-300 hover:-translate-y-0.5 border-2 border-[#121214] shadow-md"
              >
                ← فرم ثبت‌نام تور
              </Link>
            )}
            <Link
              href={loginHref}
              className="rounded-full bg-[#121214] px-5 py-2 text-white transition-all duration-300 hover:-translate-y-0.5 shadow-md border-2 border-[#f3f0f0]"
            >
              ورود تور لیدر
            </Link>
          </nav>
        </header>

        <section id="top" className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:pt-20">
          <div className="min-w-0">
            <p className="ld-in mb-4 inline-block rounded-full border-2 border-[#121214] bg-white px-4 py-1 text-sm font-bold">مخصوص تورلیدرها </p>
            <h1 className="ld-in mb-5 text-4xl font-extrabold leading-snug text-balance sm:text-5xl lg:text-6xl" style={{ animationDelay: '.1s' }}>
              ثبت‌نام مسافران تور، بدون پیام‌رسان و{' '}
              <span className="inline-block -rotate-2 rounded-xl bg-[#121214] border-2 border-[#f3f0f0] px-3 text-white">اکسل دستی</span>
            </h1>
            <div className="ld-in mb-8 max-w-xl space-y-2 text-lg leading-relaxed text-[#121214]/90" style={{ animationDelay: '.2s' }}>
              <p className="font-extrabold text-[#121214]">
                لیدرا : اپلیکیشن نصبی اندروید ، وب‌اپلیکیشن قابل نصب روی آیفون (PWA) 
              </p>
              <p className="text-justify">
                برای هر تور یک لینک اختصاصی دارید. مسافر تور، هتل و نوع حمل‌ونقل را خودش انتخاب می‌کند، مبلغ دقیق خودکار حساب می‌شود و همه‌چیز در یک جدول کنار هم می‌ماند.
              </p>
            </div>
            <div className="ld-in flex flex-wrap gap-3" style={{ animationDelay: '.3s' }}>
              <a
                href="#contact"
                className="group relative rounded-xl border-2 border-[#121214] bg-[#121214] px-7 py-3.5 font-bold text-white shadow-[4px_4px_0_rgba(255,255,255,.9)] transition-transform hover:-translate-y-0.5"
              >
                درخواست دمو
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-5 left-3 text-2xl animate-bounce drop-shadow-md"
                >
                  👆
                </span>
              </a>

              <Link
                href={sampleHref}
                className="group relative rounded-xl border-2 border-[#121214] bg-white px-7 py-3.5 font-bold text-[#121214] shadow-[4px_4px_0_#121214] transition-transform hover:-translate-y-0.5"
              >
                دیدن نمونه‌ی فرم مسافر
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-5 left-3 text-2xl animate-bounce drop-shadow-md"
                  style={{ animationDelay: '0.4s' }}
                >
                  👆
                </span>
              </Link>
            </div>
          </div>

          {/* نمونه‌ی فرم مسافر (شناور) */}
          <div className="ld-in relative mx-auto w-full max-w-md min-w-0" style={{ animationDelay: '.25s' }}>
            <div className="ld-float">
              <div
                role="img"
                aria-label="نمونه‌ی فرم ثبت‌نام مسافر با انتخاب هتل و حمل‌ونقل و مبلغ نهایی"
                className="rounded-3xl border-2 border-[#121214] bg-[#121214] p-5 text-white shadow-[10px_10px_0_rgba(255,255,255,.92)] sm:p-6"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-lg font-bold">ثبت‌نام در تور</span>
                  <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs text-zinc-300">نمونه</span>
                </div>
                <div className="mb-4 rounded-xl border border-white/20 px-4 py-3 text-sm">تور وان، ۲۵ اسفند تا ۲ فروردین</div>

                <p className="mb-2 text-xs font-bold text-zinc-300">حمل‌ونقل</p>
                <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-white/20 px-4 py-2.5 text-sm">
                  <span>قطار ۴ تخته</span>
                  <span className="text-xs text-zinc-300">بدون هزینه‌ی اضافه</span>
                </div>
                <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border-2 border-[#F9704E] bg-[#F9704E]/15 px-4 py-2.5 text-sm font-bold">
                  <span>هواپیما</span>
                  <span className="text-xs text-[#FF9A7D]">۳٬۰۰۰٬۰۰۰ تومان</span>
                </div>

                <p className="mb-2 text-xs font-bold text-zinc-300">هتل</p>
                <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border-2 border-[#F9704E] bg-[#F9704E]/15 px-4 py-2.5 text-sm font-bold">
                  <span>هتل چهار ستاره</span>
                  <span className="text-xs text-[#FF9A7D]">۱۱٬۸۰۰٬۰۰۰ تومان</span>
                </div>
                <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-white/20 px-4 py-2.5 text-sm">
                  <span>هتل سه ستاره</span>
                  <span className="text-xs text-zinc-300">۹٬۹۰۰٬۰۰۰ تومان</span>
                </div>

                <div className="space-y-1 border-t border-white/20 pt-4 text-sm text-zinc-300">
                  <div className="flex justify-between"><span>قیمت پایه‌ی تور</span><span>۹٬۹۰۰٬۰۰۰</span></div>
                  <div className="flex justify-between"><span>تعداد نفرات</span><span>۲</span></div>
                  <div className="flex items-baseline justify-between pt-2 text-lg font-extrabold text-white">
                    <span>جمع نهایی</span>
                    <span className="text-[#F9704E]">۴۹٬۴۰۰٬۰۰۰ تومان</span>
                  </div>
                </div>
              </div>
            </div>

            {/* برچسب گرافیکی */}
            <div aria-hidden="true" className="absolute -left-3 -top-5 flex rotate-6 items-center gap-2 rounded-xl border-2 border-[#121214] bg-white px-3 py-1.5 text-sm font-bold shadow-[3px_3px_0_#121214]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="ld-pulse absolute inline-flex h-full w-full rounded-full bg-[#F9704E]" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#F9704E]" />
              </span>
              محاسبه‌ی خودکار
            </div>
          </div>
        </section>
      </div>

      {/* ───────── نوار متحرک ───────── */}
      <div aria-hidden="true" className="overflow-hidden border-y-2 border-[#121214] bg-[#121214] py-3 text-[#F9704E]" dir="ltr">
        <div className="ld-marquee flex w-max gap-10 whitespace-nowrap text-lg font-bold">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={i} className="flex items-center gap-10">
              <span dir="rtl">{w}</span>
              <span className="text-white">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ───────── روش رایج و لیدرا ───────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="ld-reveal mb-10 text-3xl font-extrabold text-balance sm:text-4xl">هر تور، چند ساعت کار تکراری؟</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="ld-reveal rounded-3xl border-2 border-[#121214] bg-white p-6 shadow-[6px_6px_0_#121214] sm:p-8">
            <h3 className="mb-4 text-lg font-bold text-zinc-900">روش رایج</h3>
            <ul className="list-disc space-y-2.5 pr-5 text-zinc-900">
              <li>ثبت‌نام‌ها در چند گروه و گفتگو پخش است.</li>
              <li>فیش‌ها عکس‌اند و باید یکی‌یکی چک شوند.</li>
              <li>هتل و نوع سفر هر نفر را باید از پیام‌ها پیدا کنید.</li>
              <li>جمع مبلغ هر ثبت‌نام را دستی حساب می‌کنید.</li>
            </ul>
          </div>
          <div className="ld-reveal rounded-3xl border-2 border-[#121214] bg-[#121214] p-6 text-zinc-100 shadow-[6px_6px_0_rgba(255,255,255,.92)] sm:p-8">
            <h3 className="mb-4 text-lg font-bold text-[#F9704E]">با لیدرا</h3>
            <ul className="list-disc space-y-2.5 pr-5 marker:text-[#F9704E]">
              <li>مسافر روی یک لینک ثبت‌نام می‌کند.</li>
              <li>فیش و وضعیت پرداخت کنار نام او ثبت می‌شود.</li>
              <li>هتل و حمل‌ونقل انتخابی هر نفر در جدول دیده می‌شود.</li>
              <li>مبلغ دقیق خودکار حساب می‌شود.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── ویژگی‌ها ───────── */}
      <section id="features" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="ld-reveal mb-12 text-3xl font-extrabold text-balance sm:text-4xl">فقط کارهایی که یک تورلیدر هر روز انجام می‌دهد</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="ld-reveal min-w-0 rounded-2xl border-2 border-[#121214] bg-white p-6 shadow-[6px_6px_0_#121214] transition-all duration-200 hover:-translate-y-1 hover:shadow-[9px_9px_0_#121214]">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#121214] text-[#F9704E]">
                <Icon d={f.icon} />
              </span>
              <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
              <p className="text-[#121214]">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── مزیت رقابتی: هوش مصنوعی در لیدرا ───────── */}
      <section id="ai-edge" className="border-t-2 border-[#F9704E] bg-[#121214] text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="ld-reveal mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F9704E]/50 bg-[#F9704E]/15 px-4 py-1 text-xs font-extrabold text-[#F9704E]">
                <span className="relative flex h-2 w-2">
                  <span className="ld-pulse absolute inline-flex h-full w-full rounded-full bg-[#F9704E]" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F9704E]" />
                </span>
                مزیت رقابتی لیدرا
              </div>
              <h2 className="text-3xl font-extrabold text-balance sm:text-4xl">
                ابزارهای <span className="text-[#F9704E]">هوشمند</span> در کنار مدیریت تور
              </h2>
            </div>
            <p className="max-w-md text-sm text-zinc-300">
              فراتر از یک فرم ثبت‌نام ساده؛ برنامه‌ی سفر، پاسخ به سؤال‌های مسافران و حساب‌وکتاب مالی تور خودکار می‌شود تا فقط روی اجرای تور تمرکز کنید.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
  {AI_ADVANTAGES.map((item) => (
    <div
      key={item.title}
      className="ld-reveal ld-ai-card group relative flex flex-col justify-between rounded-3xl border-2 border-[#F9704E] bg-[#1a1a1e] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F9704E]"
    >
      <div>
        <div className="mb-5 flex items-center justify-between gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F9704E] text-[#121214] transition-transform duration-300 group-hover:scale-110">
            <Icon d={item.icon} />
          </span>
          <span
            className={
              item.isSoon
                ? 'rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-extrabold text-amber-300'
                : 'rounded-full border border-[#F9704E]/50 bg-[#F9704E]/20 px-3 py-1 text-xs font-extrabold text-[#F9704E]'
            }
          >
            {item.badge}
          </span>
        </div>
        <h3 className="mb-2.5 text-lg font-extrabold text-white">
          {item.title}
          {item.isSoon && (
            <span className="mr-2 inline-block rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-bold text-amber-300 align-middle">
              به‌زودی
            </span>
          )}
        </h3>
 <p className="text-justify leading-relaxed text-sm text-zinc-300">
  {item.text}
</p>
      </div>
    </div>
  ))}
</div>
          {/* نمونه‌ی بصری: تحلیل مالی و دستیار پاسخ‌گو */}
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="ld-reveal min-w-0 rounded-3xl border-2 border-[#F9704E] bg-[#1a1a1e] p-5 sm:p-6">
             
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-sm font-extrabold text-[#F9704E]">تحلیل مالی تور</span>
                <span className="rounded-full bg-white/10 px-3 py-0.5 text-[11px] text-zinc-300">نمونه</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-white">
                <div className="min-w-0 rounded-2xl border border-white/15 p-3">
                  <div className="text-[11px] text-zinc-400">جمع مبلغ ثبت‌نام‌ها</div>
                  <div className="mt-1 truncate text-sm font-extrabold">۱۲۰٬۰۰۰٬۰۰۰</div>
                </div>
                <div className="min-w-0 rounded-2xl border border-white/15 p-3">
                  <div className="text-[11px] text-zinc-400">وصول‌شده</div>
                  <div className="mt-1 truncate text-sm font-extrabold text-emerald-400">۷۸٬۰۰۰٬۰۰۰</div>
                </div>
                <div className="min-w-0 rounded-2xl border border-white/15 p-3">
                  <div className="text-[11px] text-zinc-400">هزینه‌ی کل</div>
                  <div className="mt-1 truncate text-sm font-extrabold">۸۵٬۰۰۰٬۰۰۰</div>
                </div>
                <div className="min-w-0 rounded-2xl border-2 border-[#F9704E] bg-[#F9704E]/10 p-3">
                  <div className="text-[11px] text-zinc-300">سود پیش‌بینی‌شده</div>
                  <div className="mt-1 truncate text-sm font-extrabold text-[#F9704E]">۳۵٬۰۰۰٬۰۰۰</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[11px] text-zinc-300">
                  <span>درصد وصول</span>
                  <span className="font-bold text-emerald-400">۶۵٪</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[65%] rounded-full bg-emerald-500" />
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-[12px] leading-6 text-zinc-200">
                <li className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">سربه‌سر شدن: ۷ نفر؛ الان ۵ نفر بالاتر هستید.</li>
                <li className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-amber-200">۲ فیش منتظر تأیید شماست.</li>
              </ul>
            </div>

            <div className="ld-reveal min-w-0 rounded-3xl border-2 border-[#F9704E] bg-[#1a1a1e] p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-sm font-extrabold text-[#F9704E]">دستیار پاسخ‌گوی تور</span>
                <span className="rounded-full bg-white/10 px-3 py-0.5 text-[11px] text-zinc-300">نمونه</span>
              </div>
              <div className="space-y-2.5 text-[12px] leading-6">
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl bg-[#F9704E] px-3 py-2 text-white">هتل‌ها چه فرقی دارند؟</div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[88%] whitespace-pre-line rounded-2xl border border-[#F9704E] bg-[#1e1e22] px-3 py-2 text-zinc-100">{'• هتل چهار ستاره — ۱۱٬۸۰۰٬۰۰۰ تومان\n• هتل سه ستاره — ۹٬۹۰۰٬۰۰۰ تومان\nقیمت هر نفر است و در فرم خودکار جمع می‌شود.'}</div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl bg-[#F9704E] px-3 py-2 text-white">روش پرداخت چیست؟</div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[88%] rounded-2xl border border-[#F9704E] bg-[#1e1e22] px-3 py-2 text-zinc-100">کارت‌به‌کارت یا آنلاین؛ بعد از ثبت، لیدر پرداخت شما را تأیید می‌کند.</div>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-5 text-zinc-400">جواب‌ها از روی اطلاعاتی است که خود لیدر برای همان تور وارد کرده؛ هزینه‌ی جداگانه ندارد.</p>
            </div>
          </div>
</div>
      </section>

      {/* ───────── نحوه‌ی کار ───────── */}
      <section id="how" className="border-y-2 border-[#121214] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="ld-reveal mb-12 text-3xl font-extrabold text-balance sm:text-4xl">از ساخت تور تا لیست نهایی، سه قدم</h2>
          <ol className="grid gap-10 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="ld-reveal flex min-w-0 gap-4">
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full border-2 border-[#121214] bg-[#F9704E] text-xl font-extrabold shadow-[3px_3px_0_#121214]">
                  {s.n}
                </span>
                <div>
                  <h3 className="mb-1.5 text-lg font-bold">{s.title}</h3>
                  <p className="text-[#121214]">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── نمونه‌ی جدول لیدر ───────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="ld-reveal mb-3 text-3xl font-extrabold text-balance sm:text-4xl">انتخاب هر مسافر، کنار نام او</h2>
        <p className="ld-reveal mb-8 max-w-xl text-white">
          هتل ، حمل‌ ونقل و مبلغ هر نفر در جدول است.دیگر لازم نیست دنبال پیامی بگردی که نوشته «من هواپیما می‌خواهم». 
        </p>
        <div className="ld-reveal overflow-x-auto rounded-2xl border-2 border-[#121214] bg-white shadow-[8px_8px_0_#121214]">
          <table className="w-full min-w-720px border-collapse text-right text-sm">
            <caption className="caption-bottom px-4 py-3 text-right text-xs text-zinc-800">داده‌ی نمونه برای نمایش</caption>
            <thead>
              <tr className="bg-[#121214] text-white">
                <th className="px-4 py-3.5 font-bold">مسافر</th>
                <th className="px-4 py-3.5 font-bold">هتل</th>
                <th className="px-4 py-3.5 font-bold">حمل‌ونقل</th>
                <th className="px-4 py-3.5 font-bold">مبلغ (تومان)</th>
                <th className="px-4 py-3.5 font-bold">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.name} className="border-t border-zinc-200">
                  <td className="px-4 py-3.5 font-bold">
                    {r.name}
                    <span className="block text-xs font-normal text-[#121214]">{r.seats}</span>
                  </td>
                  <td className="px-4 py-3.5">{r.hotel}</td>
                  <td className="px-4 py-3.5">{r.transport}</td>
                  <td className="px-4 py-3.5 font-bold">{r.amount}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block rounded-full px-3 py-0.5 text-xs ${r.tone}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ───────── امنیت ───────── */}
      <section id="trust" className="border-y-2 border-[#121214] bg-[#121214] text-zinc-100">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="ld-reveal min-w-0">
            <h2 className="mb-4 text-3xl font-extrabold text-balance text-[#F9704E] sm:text-4xl">اطلاعات مسافران شما، فقط برای شما</h2>
            <p className="max-w-md text-zinc-100">
              مسافران شما به شما اعتماد کرده‌اند. لیدرا هم طوری ساخته شده که این اطلاعات پیش شما و جدا از بقیه بماند.
            </p>
          </div>
          <ul className="ld-reveal min-w-0 list-disc space-y-3.5 pr-5 marker:text-[#F9704E]">
            <li>لیدرا؛ پلتفرم آنلاین مدیریت تور و مسافر </li>
            <li>هر لیدر فقط مسافران و تورهای خودش را می‌بیند.</li>
            <li>رمز عبور رمزنگاری می‌شود. ورود اول با رمز موقت است و تغییر رمز اجباری است.</li>
            <li>ارتباط با سایت از مسیر امن (HTTPS) انجام می‌شود.</li>
            <li>مبلغ ثبت‌نام فقط سمت سرور محاسبه می‌شود.</li>
            <li className="text-[#FF9A7D]">پرداخت آنلاین: در صورت درخواست راه اندازی می شود. فیش واریزی فعال است.</li>
          </ul>
        </div>
      </section>

      {/* ───────── دعوت به اقدام ───────── */}
      <section id="contact" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="ld-reveal relative overflow-hidden rounded-3xl border-2 border-[#121214] bg-white px-6 py-14 text-center shadow-[10px_10px_0_#121214] sm:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#F9704E]" />
          <div aria-hidden="true" className="ld-spin pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full border-[3px] border-dashed border-[#121214]/40" />
          <div className="relative">
            <h2 className="mb-4 text-3xl font-extrabold text-balance sm:text-4xl">با یک تور شروع کنید</h2>
            <p className="mx-auto mb-8 max-w-lg text-[#121214]">
              دمو را ببینید، یک تور واقعی بسازید و همان‌جا نتیجه را با روش فعلی‌تان مقایسه کنید.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://t.me/myproweb56"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border-2 border-[#121214] bg-[#F9704E] px-7 py-3.5 font-bold text-white shadow-[4px_4px_0_#121214] transition-transform hover:-translate-y-0.5"
              >
                گفتگو در تلگرام
              </a>
              <a
                href="https://wa.me/989194077618"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border-2 border-[#121214] bg-[#F9704E] px-7 py-3.5 font-bold text-white shadow-[4px_4px_0_#121214] transition-transform hover:-translate-y-0.5"
              >
                گفتگو در واتساپ
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer id="page-bottom" className="border-t-2 border-[#121214]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm font-large sm:px-6">
          <img
            src="/logo.png"
            alt="Lidera Logo"
            className="h-14 sm:h-16 w-auto object-contain"
          />
          <div className="w-full text-left my-4">
            <a
              href="https://lidera-demo.ir"
              className="inline-block text-2xl sm:text-3xl font-extrabold tracking-wider underline"
            >
              lidera-demo.ir
            </a>
          </div>
        </div>
      </footer>

      {/* دکمه‌های شناور: رفتن به بالا و پایین صفحه */}
      <div className="fixed bottom-5 left-4 z-50 flex flex-col gap-3 sm:left-6">
        <a
          href="#page-top"
          aria-label="رفتن به بالای صفحه"
          title="بالای صفحه"
          className="ld-up-btn group flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-[#121214] text-[#F9704E] shadow-[3px_3px_0_rgba(18,18,20,.55)] transition-colors hover:bg-white hover:text-[#121214] focus\visible:outline focus-visible:outline-2 focus\visible:outline-offset-2 focus-visible:outline-[#121214]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 transition-transform group-hover:-translate-y-0.5" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </a>
        <a
          href="#page-bottom"
          aria-label="رفتن به پایین صفحه"
          title="پایین صفحه"
          className="ld-down-btn group flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#121214] bg-white text-[#121214] shadow-[3px_3px_0_#121214] transition-colors hover:bg-[#121214] hover:text-[#F9704E] focus\visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus\visible:outline-[#121214]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 transition-transform group-hover:translate-y-0.5" aria-hidden="true">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </a>
      </div>
    </div>
  );
}