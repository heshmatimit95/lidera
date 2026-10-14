"use client";
import React from 'react';
// آیکون‌های شبکه های اجتماعی از react-icons
import { FaInstagram, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
// برای روبیکا آیکون اختصاصی در این کتابخانه نیست، یک آیکونِ عمومیِ چت می گذاریم که به جاش آیکون روبیکا را جایگزین کنیم
import { MdChat } from 'react-icons/md';

// این کامپوننت مقادیر (value) و تابعِ تغییر (onChange) را از فرم اصلی می گیرد
const SocialLinksInput = ({ values, onChange }) => {
  // تعریف استایل ها به صورت آرایه ای برای تمیزی کدهای پایین
  const socialPlatforms = [
    { name: 'instagram', icon: FaInstagram, color: '#E1306C', bg: 'rgba(225, 48, 108, 0.1)', placeholder: 'آیدی اینستاگرام (مثلاً: lidera_tours)' },
    { name: 'telegram', icon: FaTelegramPlane, color: '#0088cc', bg: 'rgba(0, 136, 204, 0.1)', placeholder: 'آیدی تلگرام یا شماره تماس' },
    { name: 'whatsapp', icon: FaWhatsapp, color: '#25D366', bg: 'rgba(37, 211, 102, 0.1)', placeholder: 'شماره واتساپ (با 98)' },
    // آیکون روبیکا را با MdChat فعلا گذاشتیم، می تونی SVG خودش را جایگزین کنی
    { name: 'rubika', icon: MdChat, color: '#e6244d', bg: 'rgba(230, 36, 77, 0.1)', placeholder: 'آیدی روبیکا یا شماره تماس' },
  ];

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mt-8 mb-8">
      {/* تیتر بخش با تم نارنجی لیدرا */}
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <span className="w-2 h-8 bg-[#FF6A1F] rounded-full"></span>
        راه‌های ارتباطی در شبکه‌های اجتماعی
      </h3>
      
      {/* توضیحات کوتاه و دوستانه */}
      <p className="text-gray-600 mb-8 text-sm bg-gray-50 p-4 rounded-xl">
        رفیق لیدر، هرکدام از این پلتفرم‌ها که در آن فعالی را وارد کن تا ما راحت‌تر بتوانیم با تو هماهنگ شویم. این فیلدها اختیاری هستند.
      </p>

      {/* گرید ۴ تایی فیلدها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {socialPlatforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <div key={platform.name} className="relative group">
              {/* لیبل بالای فیلد با آیکون */}
              <label 
                htmlFor={platform.name} 
                className="flex items-center gap-2 mb-2 text-sm font-semibold capitalize"
                style={{ color: platform.color }}
              >
                <Icon className="text-lg" />
                {platform.name}
              </label>
              
              {/* کادر ورودی (Input) با تمِ رنگیِ هر پلتفرم */}
              <input
                type="text"
                id={platform.name}
                name={platform.name}
                value={values[platform.name] || ''}
                onChange={onChange}
                placeholder={platform.placeholder}
                // استایل های Tailwind: هاور و فوکوس با تمِ اختصاصی
                className="w-full px-5 py-4 text-gray-800 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:bg-white transition-all text-sm pr-12"
                style={{
                  borderColor: platform.color,
                  '--tw-ring-color': platform.color, // تعریف رنگ رینگ فوکوس
                }}
              />
              
              {/* آیکون داخل کادر سمت راست */}
              <div 
                className="absolute right-4 bottom-[14px] p-2 rounded-lg"
                style={{ backgroundColor: platform.bg }}
              >
                <Icon className="text-xl" style={{ color: platform.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocialLinksInput;
