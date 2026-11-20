// فوتر مشترک لیدرا + دکمه‌های شناور بالا/پایین صفحه
// استفاده: <SiteFooter /> در انتهای ریشه‌ی صفحه (داخل div اصلی) و id="page-top" روی div ریشه
const CSS = `
html{scroll-behavior:smooth}
@keyframes ld-show{from{opacity:0;transform:translateY(10px) scale(.85);pointer-events:none}to{opacity:1;transform:none;pointer-events:auto}}
@keyframes ld-hide{from{opacity:1;transform:none;pointer-events:auto}to{opacity:0;transform:translateY(-10px) scale(.85);pointer-events:none}}
@supports (animation-timeline: scroll()){
  .ld-up-btn{opacity:0;animation:ld-show both linear;animation-timeline:scroll(root block);animation-range:0px 320px}
  .ld-down-btn{animation:ld-hide both linear;animation-timeline:scroll(root block);animation-range:calc(100% - 320px) 100%}
}
@media (prefers-reduced-motion: reduce){
  html{scroll-behavior:auto}
  .ld-up-btn,.ld-down-btn{animation:none!important;opacity:1!important;transform:none!important;pointer-events:auto!important}
}
`;

export default function SiteFooter() {
  return (
    <>
      <style>{CSS}</style>

      <footer id="page-bottom" className="mt-10 border-t-2 border-[#121214] bg-[#F9704E] text-[#121214]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6">
                 <div className="my-4 w-full text-left">
            <a
              href="https://lidera.ir"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-2xl font-extrabold tracking-wider underline sm:text-3xl"
            >
              lidera.ir
            </a>
          </div>
        </div>
      </footer>

      {/* دکمه‌های شناور: رفتن به بالا و پایین صفحه */}
      <div className="fixed bottom-5 left-4 z-40 flex flex-col gap-3 sm:left-6">
        <a
          href="#page-top"
          aria-label="رفتن به بالای صفحه"
          title="بالای صفحه"
          className="ld-up-btn group flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-[#121214] text-[#F9704E] shadow-[3px_3px_0_rgba(18,18,20,.55)] transition-colors hover:bg-white hover:text-[#121214]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 transition-transform group-hover:-translate-y-0.5" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </a>
        <a
          href="#page-bottom"
          aria-label="رفتن به پایین صفحه"
          title="پایین صفحه"
          className="ld-down-btn group flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#121214] bg-white text-[#121214] shadow-[3px_3px_0_#121214] transition-colors hover:bg-[#121214] hover:text-[#F9704E]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 transition-transform group-hover:translate-y-0.5" aria-hidden="true">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </a>
      </div>
    </>
  );
}