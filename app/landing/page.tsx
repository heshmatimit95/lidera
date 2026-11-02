import React from 'react';
import { 
  FaRocket, FaShieldAlt, FaFileExcel, FaTelegramPlane, 
  FaWhatsapp, FaCheckCircle, FaUserCheck, FaBolt, FaArrowLeft 
} from 'react-icons/fa';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans dir-rtl selection:bg-orange-500 selection:text-black">
      
      {/* هدر سایت */}
      <header className="border-b border-zinc-800/80 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl .bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-black text-black shadow-lg shadow-orange-950/40">
              L
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              لیدرا <span className="text-orange-500 text-xs font-medium">lidera.ir</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/login" 
              className="text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3 py-2"
            >
              ورود لیدرها
            </a>
            <a 
              href="/register" 
              className="text-xs sm:text-sm font-bold bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-orange-950/50"
            >
              تست رایگان
            </a>
          </div>
        </div>
      </header>

      {/* بخش اصلی (Hero Section) */}
      <section className="relative pt-12 pb-20 px-4 overflow-hidden">
        <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-orange-400 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 shadow-inner">
            <FaBolt className="text-amber-400 animate-pulse" /> 
            بدون نیاز به زیرساخت پیچیده | ویژه شرایط فعلی بازار ایران
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6">
            دیگه درگیر <span className="text-transparent bg-clip-text .bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-500">فیش‌های تلگرامی و شلوغی اکسل</span> نشو!
          </h1>

          <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            سامانه هوشمند **لیدرا**؛ ثبت‌نام اتوماتیک مسافر، تایید و رد آنلاین فیش‌های واریزی، و گرفتن خروجی بیمه فقط در ۳۰ ثانیه.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <a 
              href="/register" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-sm px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-950/40 hover:scale-[1.02]"
            >
              <span>شروع استفاده بدون هزینه اولیه</span>
              <FaArrowLeft />
            </a>
            <a 
              href="#demo" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-sm px-6 py-3.5 rounded-2xl transition-all"
            >
              دیدن محیط پنل
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><FaShieldAlt className="text-emerald-500" /> بدون ورودی اجباری</span>
            <span className="flex items-center gap-1.5"><FaCheckCircle className="text-emerald-500" /> فعال‌سازی زیر ۲ دقیقه</span>
          </div>
        </div>
      </section>

      {/* بخش قبل/بعد (واقعیت بازار ایران) */}
      <section className="py-16 bg-neutral-950 border-y border-zinc-900 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">چرا لیدرهای پرکار سیستم دستی رو کنار گذاشتن؟</h2>
            <p className="text-zinc-400 text-xs sm:text-sm">تفاوت مدیریت سنتّی با اتوماسیون لیدرا در شرایط اقتصادی امروز</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* قبل از لیدرا */}
            <div className="bg-red-950/10 border border-red-900/30 rounded-2xl p-6 relative">
              <span className="text-red-400 font-bold text-xs bg-red-950/50 px-3 py-1 rounded-full border border-red-900/40 inline-block mb-4">
                ❌ روش قدیمی و پرخطر
              </span>
              <ul className="space-y-3.5 text-xs sm:text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  گم شدن فیش‌های ۳–۴ میلیونی بین صدها پیام تلگرام و واتساپ.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  اشتباه تایپی کدملی مسافر و باطل شدن بیمه موقع حادثه!
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  ساعت‌ها وقت تلف کردن برای مرتب‌کردن دستی اکسل اتوبوس.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  بی‌اعتمادی مسافر به شماره کارت‌های شخصی و اسکرین‌شات‌ها.
                </li>
              </ul>
            </div>

            {/* بعد از لیدرا */}
            <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-2xl p-6 relative">
              <span className="text-emerald-400 font-bold text-xs bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-900/40 inline-block mb-4">
                ✅ روش هوشمند با لیدرا
              </span>
              <ul className="space-y-3.5 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-emerald-400 mt-0.5 shrink-0" />
                  آپلود مستقیم فیش توسط مسافر + تغییر رنگ داینامیک وضعیت مالی در پنل.
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-emerald-400 mt-0.5 shrink-0" />
                  خروجی اکسل ۱۰۰٪ تمیز و استاندارد جهت ارسال مستقیم به بیمه.
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-emerald-400 mt-0.5 shrink-0" />
                  ارسال لینک ثبت‌نام در تلگرام و واتساپ تنها با ۱ کلیک.
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-emerald-400 mt-0.5 shrink-0" />
                  حفظ برند شخصی لیدر و پرستیژ بالا جلوی مسافران.
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* امکانات اصلی (Features Grid) */}
      <section id="demo" className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-orange-500 text-xs font-bold uppercase tracking-widest">امکانات پنل</span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">همه ابزارهایی که یک لیدر نیاز داره</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-xl mb-4 border border-orange-500/20">
              <FaUserCheck />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">تایید هوشمند فیش</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              مشاهده تصویر فیش، تاریخ و مبلغ. تغییر لحظه‌ای وضعیت به پرداخت‌شده، بیعانه یا رد مغایرت.
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl mb-4 border border-emerald-500/20">
              <FaFileExcel />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">خروجی فوری اکسل</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              یک کلیک و دانلود اکسل آماده شامل کدملی، تاریخ تولد و شماره همراه برای شرکت بیمه و راننده.
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center text-xl mb-4 border border-sky-500/20">
              <FaTelegramPlane />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">اشتراک‌گذاری موشکی</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ارسال مستقیم لینک ثبت‌نام تور به اپلیکیشن تلگرام و واتساپ بدون باز شدن مرورگر جانبی.
            </p>
          </div>
        </div>
      </section>

      {/* بخش قیمت‌گذاری اقتصادی (واقع‌بینانه) */}
      <section className="py-20 bg-neutral-950 border-t border-zinc-900 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="bg-orange-500/10 text-orange-400 text-xs font-extrabold px-3 py-1 rounded-full border border-orange-500/20">
              بدون فشار مالی
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 mb-2">
              کمتر از قیمت یک وعده ناهار در تور!
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              انتخاب کن: تست رایگان یا پرداخت بر اساس کارکرد واقعی
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* تست */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-zinc-300 text-base mb-1">تست اولیه</h3>
                <p className="text-[11px] text-zinc-500 mb-4">برای لیدرهایی که می‌خواهند از سرعت سیستم مطمئن شوند.</p>
                <div className="text-3xl font-black text-white mb-6">رایگان <span className="text-xs text-zinc-500 font-normal">/ ۲ تور اول</span></div>
                <ul className="space-y-2.5 text-xs text-zinc-300 mb-6">
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> ثبت‌نام تا ۲۰ مسافر</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> تایید فیش آنلاین</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> خروجی اکسل بیمه</li>
                </ul>
              </div>
              <a href="/register" className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl text-center transition-all block">
                تست رایگان
              </a>
            </div>

            {/* ماهانه */}
            <div className=".bg-gradient-to-b from-zinc-900 to-neutral-900 border-2 border-orange-500 p-6 rounded-3xl flex flex-col justify-between relative shadow-xl shadow-orange-950/20">
              <div className="absolute -top-3.5 right-1/2 translate-x-1/2 bg-orange-500 text-black font-extrabold text-[10px] px-3 py-0.5 rounded-full">
                پیشنهاد لیدرها
              </div>
              <div>
                <h3 className="font-bold text-orange-400 text-base mb-1">اشتراک ماهانه</h3>
                <p className="text-[11px] text-zinc-400 mb-4">برای لیدرهای پرکار با ثبت نام نامحدود.</p>
                <div className="text-3xl font-black text-white mb-1">۱۹۹,۰۰۰ <span className="text-xs text-zinc-400 font-normal">تومان / ماهانه</span></div>
                <p className="text-[10px] text-zinc-500 mb-6">معادل روزی فقط ۶ هزار تومان!</p>
                <ul className="space-y-2.5 text-xs text-zinc-200 mb-6">
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-orange-400" /> تور و مسافر نامحدود</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-orange-400" /> مدیریت کامل مالی و فیش‌ها</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-orange-400" /> پشتیبانی تلگرام و واتساپ</li>
                </ul>
              </div>
              <a href="/register?plan=monthly" className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs rounded-xl text-center transition-all shadow-md block">
                فعال‌سازی سریع
              </a>
            </div>

            {/* درصدی */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-zinc-300 text-base mb-1">درصدی (به ازای مسافر)</h3>
                <p className="text-[11px] text-zinc-500 mb-4">بدون اشتراک ثابت؛ فقط در صورت ثبت‌نام قطعی.</p>
                <div className="text-3xl font-black text-white mb-6">۵,۰۰۰ <span className="text-xs text-zinc-500 font-normal">تومان / هر نفر</span></div>
                <ul className="space-y-2.5 text-xs text-zinc-300 mb-6">
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-amber-500" /> ریسک مالی صفر</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-amber-500" /> قابلیت اضافه به مبلغ تور</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-amber-500" /> دسترسی به همه امکانات</li>
                </ul>
              </div>
              <a href="/register?plan=pay_per_user" className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl text-center transition-all block">
                انتخاب مدل درصدی
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* فوتر */}
      <footer className="border-t border-zinc-900 py-8 px-4 text-center text-xs text-zinc-600">
        <p>سامانه هوشمند مدیریت تور «لیدرا» © ۲۰۲۶ — تمامی حقوق محفوظ است.</p>
      </footer>

    </div>
  );
}