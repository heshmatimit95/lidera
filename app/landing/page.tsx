import React from 'react';
import Image from 'next/image';
import { 
  FaRocket, FaShieldAlt, FaFileExcel, FaTelegramPlane, 
  FaWhatsapp, FaCheckCircle, FaTimesCircle, FaUserCheck, FaBolt, FaArrowLeft, FaMagic, FaBuilding
} from 'react-icons/fa';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 font-sans dir-rtl selection:bg-[#F9704E] selection:text-black overflow-x-hidden">
      
      {/* زمینه مشبک نئونی */}
      <div className="fixed inset-0 bg-[radial-gradient(#1f1f2e_1px,transparent_1px)] background-size:24px_24px] opacity-20 pointer-events-none z-0"></div>

      {/* هدر سایت */}
      <header className="border-b border-[#F9704E]  bg-zinc-100  backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#F9704E]/40 shadow-lg shadow-[#F9704E]/20">
          <img 
  src="/logo.png" 
  alt="Lidera Logo" 
  className="h-8 sm:h-10 w-auto object-contain mx-auto" 
/>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
               lidera<span className="text-[#F9704E] text-[10px] font-bold bg-[#F9704E]/10 px-2 py-0.5 rounded-full border border-[#F9704E]/30"></span>
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">lidera.ir</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href="/login" 
              className="text-xs sm:text-sm font-semibold  bg-[#e0a394]  text-zinc-300 hover:text-white transition-colors px-4 py-2.5 rounded-xl hover:bg-[#F9704E]"
            >
              ورود لیدرها
            </a>
            <a 
              href="/register" 
              className="text-xs sm:text-sm font-black bg-[#F9704E] hover:bg-[#e05f3d] text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#F9704E]/25 hover:scale-105"
            >
              شروع رایگان
            </a>
          </div>
        </div>
      </header>

      {/* بخش هیرو (Hero Section) */}
      <section className="relative pt-16 pb-24 px-4 z-10">
        <div className="absolute top-10 right-1/2 translate-x-1/2 w-500px] h-300px] bg-[#F9704E]/15 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#F9704E]/10 border border-[#F9704E]/30 text-[#F9704E] px-4 py-1.5 rounded-full text-xs font-bold mb-8 shadow-xl">
            <FaBolt className="text-[#F9704E] animate-bounce" /> 
            ثبت‌نام و مدیریت مسافران تور بدون دردسر
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-8">
            ثبت‌نام و مدیریت مسافران تور؛ <br className="hidden sm:inline" />
            <span className="text-[#F9704E]">بدون دردسرِ پیام، فیش و حساب‌کتاب دستی</span>
          </h1>

          <p className="text-zinc-300 text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            لیدرا یک لینک اختصاصی به شما می‌دهد؛ مسافر خودش ثبت‌نام و پرداخت می‌کند، و لیست کامل مسافران به همراه خروجی بیمه آماده می‌شود.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <a 
              href="/register" 
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#F9704E] hover:bg-[#e05f3d] text-white font-black text-sm px-8 py-4 rounded-2xl transition-all shadow-xl shadow-[#F9704E]/25 hover:scale-[1.03]"
            >
              <span>دمو لیدرا</span>
              <FaArrowLeft />
            </a>
            <a 
              href="#pricing" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-300 hover:bg-zinc-300 border border-zinc-700/80 text-zinc-900 font-bold text-sm px-7 py-4 rounded-2xl transition-all"
            >
              مشاهده تعرفه‌ها
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-xs text-zinc-400 border-t border-zinc-800/60 pt-6 max-w-lg mx-auto">
            <span className="flex items-center gap-2"><FaShieldAlt className="text-[#F9704E] text-sm" /> بدون نیاز به کارت بانکی در ابتدا</span>
            <span className="flex items-center gap-2"><FaCheckCircle className="text-[#F9704E] text-sm" /> فعال‌سازی کمتر از ۳۰ ثانیه</span>
          </div>
        </div>
      </section>

      {/* مقایسه قبل و بعد */}
      <section className="py-20 bg-[#09090d] border-y border-zinc-800/80 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">چرا تورلیدرهای حرفه‌ای لیدرا را انتخاب کردند؟</h2>
            <p className="text-zinc-400 text-sm">پایان فیش‌های گم‌شده و پیام‌های شلوغ در شبکه اجتماعی</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-950/80 border border-red-900/40 rounded-3xl p-7 relative shadow-2xl">
              <span className="text-red-400 font-extrabold text-xs bg-red-950/80 px-3.5 py-1.5 rounded-full border border-red-800/50 inline-block mb-6">
                ❌ ثبت‌نام دستی و سنتی
              </span>
              <ul className="space-y-4 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  گم شدن فیش‌های واریزی در لابلای پیام‌های چت تلگرام و واتساپ.
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  خطای تایپی در کد ملی و تاریخ تولد مسافر و دردسرهای رد بیمه.
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  ساعت‌ها وقت‌گرفتن برای تنظیم لیست اکسل مسافران و اتوبوس.
                </li>
              </ul>
            </div>

            <div className="bg-zinc-900/90 border border-[#F9704E]/50 rounded-3xl p-7 relative shadow-2xl shadow-[#F9704E]/10">
              <span className="text-[#F9704E] font-extrabold text-xs bg-[#F9704E]/10 px-3.5 py-1.5 rounded-full border border-[#F9704E]/30 inline-block mb-6">
                ✅ ثبت‌نام خودکار با لیدرا
              </span>
              <ul className="space-y-4 text-xs sm:text-sm text-zinc-100">
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-[#F9704E] mt-1 shrink-0 text-base" />
                  آپلود عکس فیش یا پرداخت آنلاین مستقیم توسط خود مسافر.
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-[#F9704E] mt-1 shrink-0 text-base" />
                  دریافت فوری فایل اکسل آماده بیمه و لیست مسافران با ۱ کلیک.
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-[#F9704E] mt-1 shrink-0 text-base" />
                  لینک اختصاصی و شیک برای قرار دادن در بیو اینستاگرام و کانال‌ها.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* امکانات کلیدی */}
      <section className="py-24 px-4 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <span className="text-[#F9704E] text-xs font-black uppercase tracking-widest bg-[#F9704E]/10 px-3 py-1 rounded-full border border-[#F9704E]/20">امکانات پلتفرم</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">همه ابزارهایی که برای اجرا نیاز داری</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-900/70 border border-zinc-800 hover:border-[#F9704E]/50 p-7 rounded-3xl transition-all hover:scale-[1.02] group">
            <div className="w-12 h-12 rounded-2xl bg-[#F9704E]/10 text-[#F9704E] flex items-center justify-center text-2xl mb-6 border border-[#F9704E]/20 group-hover:bg-[#F9704E] group-hover:text-white transition-all">
              <FaUserCheck />
            </div>
            <h3 className="font-bold text-xl text-white mb-3">تایید هوشمند فیش</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              مشاهده تصویر فیش، تاریخ و مبلغ. امکان تایید یا رد سریع با تغییر وضعیت لحظه‌ای در پنل لیدر.
            </p>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 hover:border-[#F9704E]/50 p-7 rounded-3xl transition-all hover:scale-[1.02] group">
            <div className="w-12 h-12 rounded-2xl bg-[#F9704E]/10 text-[#F9704E] flex items-center justify-center text-2xl mb-6 border border-[#F9704E]/20 group-hover:bg-[#F9704E] group-hover:text-white transition-all">
              <FaFileExcel />
            </div>
            <h3 className="font-bold text-xl text-white mb-3">خروجی اکسل و بیمه</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              دانلود فایل اکسل طبق فرمت دقیق شرکت‌های بیمه و لیست تفکیک‌شده مسافران تنها با یک کلیک.
            </p>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 hover:border-[#F9704E]/50 p-7 rounded-3xl transition-all hover:scale-[1.02] group">
            <div className="w-12 h-12 rounded-2xl bg-[#F9704E]/10 text-[#F9704E] flex items-center justify-center text-2xl mb-6 border border-[#F9704E]/20 group-hover:bg-[#F9704E] group-hover:text-white transition-all">
              <FaMagic />
            </div>
            <h3 className="font-bold text-xl text-white mb-3">متن تبلیغاتی با هوش مصنوعی</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              تولید خودکار متن‌های جذاب برای پست‌های اینستاگرام و کانال‌های تلگرام متناسب با برنامه سفر تور شما.
            </p>
          </div>
        </div>
      </section>

      {/* بخش جدول تعرفه‌ها و قیمت‌گذاری */}
      <section id="pricing" className="py-24 bg-[#09090d] border-t border-zinc-800/80 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="bg-[#F9704E]/10 text-[#F9704E] text-xs font-black px-4 py-1.5 rounded-full border border-[#F9704E]/30">
              پلن‌های شفاف و منصفانه
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-3">
              جدول مقایسه برنامه‌های لیدرا
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              بر اساس نیاز خود و حجم برگزاری تور بهترین پلن را انتخاب کنید
            </p>
          </div>

          {/* جدول مقایسه در دسکتاپ و کارت‌ها در موبایل */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-700px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="p-4 text-sm font-black text-zinc-300">امکانات</th>
                  <th className="p-4 text-center text-sm font-black text-zinc-300">آزمایشی</th>
                  <th className="p-4 text-center text-sm font-black text-zinc-300">پایه</th>
                  <th className="p-4 text-center text-sm font-black text-[#F9704E] bg-[#F9704E]/10 rounded-t-2xl">حرفه‌ای (پیشنهادی)</th>
                  <th className="p-4 text-center text-sm font-black text-zinc-300">آژانس</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs sm:text-sm text-zinc-300">
                
                {/* قیمت ماهانه */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4 font-bold text-white">قیمت ماهانه (تخکینی)</td>
                  <td className="p-4 text-center font-bold text-white">رایگان</td>
                  <td className="p-4 text-center font-bold text-white">۱۵۰ تا ۳۰۰ هزار تومان</td>
                  <td className="p-4 text-center font-black text-[#F9704E] bg-[#F9704E]/5">۴۰۰ تا ۸۰۰ هزار تومان</td>
                  <td className="p-4 text-center font-bold text-white">۱ تا ۳ میلیون تومان</td>
                </tr>

                {/* تعداد تور */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4">تعداد تور مجاز</td>
                  <td className="p-4 text-center">۱ تور</td>
                  <td className="p-4 text-center">۳ تور در ماه</td>
                  <td className="p-4 text-center font-bold text-white bg-[#F9704E]/5">نامحدود</td>
                  <td className="p-4 text-center font-bold text-white">نامحدود</td>
                </tr>

                {/* تعداد مسافر */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4">تعداد مسافر</td>
                  <td className="p-4 text-center">۱۰ نفر</td>
                  <td className="p-4 text-center">۵۰ نفر در ماه</td>
                  <td className="p-4 text-center font-bold text-white bg-[#F9704E]/5">نامحدود</td>
                  <td className="p-4 text-center font-bold text-white">نامحدود</td>
                </tr>

                {/* لینک اختصاصی */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4">لینک اختصاصی ثبت‌نام</td>
                  <td className="p-4 text-center"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                  <td className="p-4 text-center"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                  <td className="p-4 text-center bg-[#F9704E]/5"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                  <td className="p-4 text-center"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                </tr>

                {/* پرداخت و کارت به کارت */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4">ثبت فیش و کارت‌به‌کارت</td>
                  <td className="p-4 text-center"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                  <td className="p-4 text-center"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                  <td className="p-4 text-center bg-[#F9704E]/5"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                  <td className="p-4 text-center"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                </tr>

                {/* درگاه پرداخت آنلاین */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4">درگاه پرداخت آنلاین مستقیم</td>
                  <td className="p-4 text-center"><FaTimesCircle className="mx-auto text-zinc-600" /></td>
                  <td className="p-4 text-center"><FaTimesCircle className="mx-auto text-zinc-600" /></td>
                  <td className="p-4 text-center bg-[#F9704E]/5"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                  <td className="p-4 text-center"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                </tr>

                {/* خروجی اکسل */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4">خروجی اکسل لیست مسافران</td>
                  <td className="p-4 text-center"><FaTimesCircle className="mx-auto text-zinc-600" /></td>
                  <td className="p-4 text-center"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                  <td className="p-4 text-center bg-[#F9704E]/5"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                  <td className="p-4 text-center"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                </tr>

                {/* لیست و خروجی بیمه */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4">خروجی فرمت استاندارد بیمه</td>
                  <td className="p-4 text-center"><FaTimesCircle className="mx-auto text-zinc-600" /></td>
                  <td className="p-4 text-center"><FaTimesCircle className="mx-auto text-zinc-600" /></td>
                  <td className="p-4 text-center bg-[#F9704E]/5"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                  <td className="p-4 text-center"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                </tr>

                {/* متن هوش مصنوعی */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4">کپشن‌ساز هوش مصنوعی</td>
                  <td className="p-4 text-center"><FaTimesCircle className="mx-auto text-zinc-600" /></td>
                  <td className="p-4 text-center text-xs text-zinc-400">محدود</td>
                  <td className="p-4 text-center bg-[#F9704E]/5"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                  <td className="p-4 text-center"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                </tr>

                {/* پیامک خودکار */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4">ارسال پیامک تایید به مسافر</td>
                  <td className="p-4 text-center"><FaTimesCircle className="mx-auto text-zinc-600" /></td>
                  <td className="p-4 text-center"><FaTimesCircle className="mx-auto text-zinc-600" /></td>
                  <td className="p-4 text-center bg-[#F9704E]/5"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                  <td className="p-4 text-center"><FaCheckCircle className="mx-auto text-[#F9704E]" /></td>
                </tr>

                {/* انتخاب پلن */}
                <tr>
                  <td className="p-4"></td>
                  <td className="p-4 text-center">
                    <a href="/register?plan=trial" className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs block font-bold transition-all">انتخاب</a>
                  </td>
                  <td className="p-4 text-center">
                    <a href="/register?plan=basic" className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs block font-bold transition-all">انتخاب</a>
                  </td>
                  <td className="p-4 text-center bg-[#F9704E]/5 rounded-b-2xl">
                    <a href="/register?plan=pro" className="px-4 py-2.5 bg-[#F9704E] hover:bg-[#e05f3d] text-white rounded-xl text-xs block font-black transition-all shadow-md shadow-[#F9704E]/20">شروع پلن حرفه‌ای</a>
                  </td>
                  <td className="p-4 text-center">
                    <a href="/register?plan=agency" className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs block font-bold transition-all">انتخاب</a>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* فوتر */}
      <footer className="border-t border-zinc-800/80 py-10 px-4 text-center text-xs text-zinc-500 relative z-10 bg-[#070709]">
        <p>سامانه اتوماسیون هوشمند مدیریت تور «لیدرا» © ۲۰۲۶ — تمامی حقوق محفوظ است.</p>
      </footer>

    </div>
  );
}