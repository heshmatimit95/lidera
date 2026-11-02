import React from 'react';
import Image from 'next/image';
import { 
  FaRocket, FaShieldAlt, FaFileExcel, FaTelegramPlane, 
  FaWhatsapp, FaCheckCircle, FaUserCheck, FaBolt, FaArrowLeft, FaStar
} from 'react-icons/fa';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 font-sans dir-rtl selection:bg-orange-500 selection:text-black overflow-x-hidden">
      
      {/* زمینه مشبک نئونی جهت عمق‌بخشی به صفحه */}
      <div className="fixed inset-0 bg-[radial-gradient(#1f1f2e_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none z-0"></div>

      {/* هدر سایت همراه با لوگوی اختصاصی */}
      <header className="border-b border-zinc-800/80 bg-[#0a0a0e]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* لوگوی رسمی لیدرا */}
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-orange-500/30 shadow-lg shadow-orange-500/20">
              <Image 
                src="/logo.png" 
                alt="لوگوی لیدرا" 
                width={40} 
                height={40} 
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-white flex items-center gap-1">
                لیدرا <span className="text-orange-500 text-xs font-bold bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">SaaS</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">lidera.ir</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href="/login" 
              className="text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition-colors px-4 py-2.5 rounded-xl hover:bg-zinc-900"
            >
              ورود لیدرها
            </a>
            <a 
              href="/register" 
              className="text-xs sm:text-sm font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:scale-105"
            >
              تست رایگان
            </a>
          </div>
        </div>
      </header>

      {/* بخش هیرو (Hero Section) پرانرژی و جذاب */}
      <section className="relative pt-16 pb-24 px-4 z-10">
        {/* افکت‌های نوری پس‌زمینه */}
        <div className="absolute top-10 right-1/2 translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-orange-500/20 to-amber-500/0 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-950/60 to-zinc-900 border border-orange-500/30 text-orange-400 px-4 py-1.5 rounded-full text-xs font-bold mb-8 shadow-xl">
            <FaBolt className="text-amber-400 animate-bounce" /> 
            اتوماسیون تخصصی مدیریت تور و فیش‌های واریزی
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight sm:leading-tight mb-8">
            دیگه درگیر <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 drop-shadow-sm">فیش‌های تلگرامی و شلوغی اکسل</span> نشو!
          </h1>

          <p className="text-zinc-300 text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            سامانه هوشمند <strong className="text-orange-400 font-bold">لیدرا</strong>؛ ثبت‌نام اتوماتیک مسافر، تایید و رد آنلاین فیش‌های واریزی، و دریافت خروجی اکسل بیمه فقط در ۳۰ ثانیه.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <a 
              href="/register" 
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:opacity-95 text-black font-black text-sm px-8 py-4 rounded-2xl transition-all shadow-xl shadow-orange-500/25 hover:scale-[1.03]"
            >
              <span>شروع استفاده بدون هزینه اولیه</span>
              <FaArrowLeft />
            </a>
            <a 
              href="#demo" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 font-bold text-sm px-7 py-4 rounded-2xl transition-all backdrop-blur-md"
            >
              مشاهده امکانات
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-xs text-zinc-400 border-t border-zinc-800/60 pt-6 max-w-lg mx-auto">
            <span className="flex items-center gap-2"><FaShieldAlt className="text-emerald-400 text-sm" /> بدون ورودی اجباری</span>
            <span className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 text-sm" /> فعال‌سازی زیر ۲ دقیقه</span>
          </div>
        </div>
      </section>

      {/* مقایسه قبل و بعد (کارت‌های سه بعدی شیک) */}
      <section className="py-20 bg-[#09090d] border-y border-zinc-800/80 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">چرا تورلیدرهای فعال لیدرا را انتخاب کردند؟</h2>
            <p className="text-zinc-400 text-sm">حل ساده و کم‌هزینه چالش‌های روزمره تورلیدری</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* روش قدیمی */}
            <div className="bg-gradient-to-b from-red-950/20 to-zinc-900/40 border border-red-900/40 rounded-3xl p-7 relative shadow-2xl backdrop-blur-md">
              <span className="text-red-400 font-extrabold text-xs bg-red-950/80 px-3.5 py-1.5 rounded-full border border-red-800/50 inline-block mb-6 shadow-inner">
                ❌ روش سنتی و پرخطای قبلی
              </span>
              <ul className="space-y-4 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  گم شدن فیش‌های چند میلیونی بین صدها پیام تلگرام و واتساپ.
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  اشتباه تایپی کدملی مسافران و باطل شدن بیمه هنگام بروز حادثه.
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></span>
                  اتلاف ساعت‌ها وقت برای تنظیم دستی لیست بیمه و چیدمان اتوبوس.
                </li>
              </ul>
            </div>

            {/* روش لیدرا */}
            <div className="bg-gradient-to-b from-orange-950/20 to-zinc-900/60 border border-orange-500/40 rounded-3xl p-7 relative shadow-2xl shadow-orange-950/30 backdrop-blur-md">
              <span className="text-orange-400 font-extrabold text-xs bg-orange-950/80 px-3.5 py-1.5 rounded-full border border-orange-500/40 inline-block mb-6 shadow-inner">
                ✅ روش هوشمند با لیدرا
              </span>
              <ul className="space-y-4 text-xs sm:text-sm text-zinc-100">
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-orange-400 mt-1 shrink-0 text-base" />
                  آپلود مستقیم فیش توسط مسافر با تغییر وضعیت لحظه‌ای در پنل.
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-orange-400 mt-1 shrink-0 text-base" />
                  خروجی اکسل استاندارد و آماده جهت ارسال مستقیم به شرکت بیمه.
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-orange-400 mt-1 shrink-0 text-base" />
                  اشتراک‌گذاری آسان لینک اختصاصی ثبت‌نام تور در پیام‌رسان‌ها.
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* بخش امکانات (Cards with Glow Effects) */}
      <section id="demo" className="py-24 px-4 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <span className="text-orange-500 text-xs font-black uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">امکانات کلیدی</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">همه ابزارهایی که یک لیدر نیاز دارد</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-orange-500/50 p-7 rounded-3xl transition-all hover:scale-[1.02] shadow-xl group">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-2xl mb-6 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-all">
              <FaUserCheck />
            </div>
            <h3 className="font-bold text-xl text-white mb-3">تایید هوشمند فیش</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              مشاهده تصویر فیش، تاریخ و مبلغ. تغییر لحظه‌ای وضعیت به پرداخت‌شده، بیعانه یا رد مغایرت.
            </p>
          </div>

          <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-orange-500/50 p-7 rounded-3xl transition-all hover:scale-[1.02] shadow-xl group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl mb-6 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black transition-all">
              <FaFileExcel />
            </div>
            <h3 className="font-bold text-xl text-white mb-3">خروجی فوری اکسل</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              یک کلیک و دانلود اکسل آماده شامل کد ملی، تاریخ تولد و شماره همراه برای شرکت بیمه و راننده.
            </p>
          </div>

          <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-orange-500/50 p-7 rounded-3xl transition-all hover:scale-[1.02] shadow-xl group">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center text-2xl mb-6 border border-yellow-500/20 group-hover:bg-yellow-500 group-hover:text-black transition-all">
              <FaTelegramPlane />
            </div>
            <h3 className="font-bold text-xl text-white mb-3">اشتراک‌گذاری موشکی</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              ارسال مستقیم لینک ثبت‌نام تور به اپلیکیشن تلگرام و واتساپ بدون باز شدن مرورگر جانبی.
            </p>
          </div>

        </div>
      </section>

      {/* بخش قیمت‌گذاری هیجان‌انگیز (Pricing) */}
      <section className="py-24 bg-[#09090d] border-t border-zinc-800/80 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="bg-orange-500/10 text-orange-400 text-xs font-black px-4 py-1.5 rounded-full border border-orange-500/30">
              قیمت‌گذاری شفاف و منصفانه
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-3">
              کمتر از قیمت یک وعده ناهار در تور!
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              انتخاب کن: تست رایگان یا پرداخت بر اساس کارکرد واقعی
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* کارت تست */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-3xl flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <h3 className="font-extrabold text-zinc-200 text-lg mb-2">تست اولیه</h3>
                <p className="text-xs text-zinc-400 mb-6">مناسب برای لیدرهایی که می‌خواهند از سرعت سیستم مطمئن شوند.</p>
                <div className="text-4xl font-black text-white mb-8">رایگان <span className="text-xs text-zinc-500 font-normal">/ ۲ تور اول</span></div>
                <ul className="space-y-3.5 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2.5"><FaCheckCircle className="text-emerald-400" /> ثبت‌نام تا ۲۰ مسافر</li>
                  <li className="flex items-center gap-2.5"><FaCheckCircle className="text-emerald-400" /> تایید آنلاین فیش‌ها</li>
                  <li className="flex items-center gap-2.5"><FaCheckCircle className="text-emerald-400" /> خروجی اکسل بیمه</li>
                </ul>
              </div>
              <a href="/register" className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl text-center transition-all block">
                تست رایگان
              </a>
            </div>

            {/* کارت ماهانه - هایلایت شده */}
            <div className="bg-gradient-to-b from-zinc-900 via-[#120d0a] to-zinc-950 border-2 border-orange-500 p-8 rounded-3xl flex flex-col justify-between relative shadow-2xl shadow-orange-950/40 scale-105">
              <div className="absolute -top-4 right-1/2 translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-[11px] px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                پیشنهاد لیدرها
              </div>
              <div>
                <h3 className="font-extrabold text-orange-400 text-lg mb-2">اشتراک ماهانه</h3>
                <p className="text-xs text-zinc-300 mb-6">برای لیدرهای پرکار با ثبت‌نام نامحدود.</p>
                <div className="text-4xl font-black text-white mb-2">۱۹۹,۰۰۰ <span className="text-xs text-zinc-400 font-normal">تومان / ماهانه</span></div>
                <p className="text-[11px] text-orange-400/80 mb-8 font-medium">معادل روزی فقط ۶ هزار تومان!</p>
                <ul className="space-y-3.5 text-xs text-zinc-200 mb-8">
                  <li className="flex items-center gap-2.5"><FaCheckCircle className="text-orange-400" /> تور و مسافر نامحدود</li>
                  <li className="flex items-center gap-2.5"><FaCheckCircle className="text-orange-400" /> مدیریت کامل مالی و فیش‌ها</li>
                  <li className="flex items-center gap-2.5"><FaCheckCircle className="text-orange-400" /> پشتیبانی اختصاصی تلگرام</li>
                </ul>
              </div>
              <a href="/register?plan=monthly" className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs rounded-xl text-center transition-all shadow-lg shadow-orange-500/20 block">
                فعال‌سازی سریع
              </a>
            </div>

            {/* کارت درصدی */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-3xl flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <h3 className="font-extrabold text-zinc-200 text-lg mb-2">درصدی (به ازای مسافر)</h3>
                <p className="text-xs text-zinc-400 mb-6">بدون اشتراک ثابت؛ فقط در صورت ثبت‌نام قطعی.</p>
                <div className="text-4xl font-black text-white mb-8">۵,۰۰۰ <span className="text-xs text-zinc-500 font-normal">تومان / هر نفر</span></div>
                <ul className="space-y-3.5 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2.5"><FaCheckCircle className="text-amber-400" /> ریسک مالی صفر</li>
                  <li className="flex items-center gap-2.5"><FaCheckCircle className="text-amber-400" /> قابلیت اضافه به مبلغ تور</li>
                  <li className="flex items-center gap-2.5"><FaCheckCircle className="text-amber-400" /> دسترسی به همه‌ی امکانات</li>
                </ul>
              </div>
              <a href="/register?plan=pay_per_user" className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl text-center transition-all block">
                انتخاب مدل درصدی
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* فوتر */}
      <footer className="border-t border-zinc-800/80 py-10 px-4 text-center text-xs text-zinc-500 relative z-10 bg-[#070709]">
        <p>سامانه هوشمند مدیریت تور «لیدرا» © ۲۰۲۶ — تمامی حقوق محفوظ است.</p>
      </footer>

    </div>
  );
}