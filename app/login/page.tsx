"use client";
import Image from 'next/image';
import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function LoginFormContent() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // تغییر مسیر به API مشترک و استاندارد لاگین
 const res = await fetch('/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // کوکی ها به صورت امن توسط سرور ست شده‌اند، نیازی به document.cookie نیست
        const targetSlug = slug || data.slug;
        if (targetSlug) {
          router.push(`/leader?slug=${targetSlug}`);
        } else {
          router.push('/leader');
        }
      } else {
        setError(data.error || 'خطا در نام کاربری یا رمز عبور');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };
return (
    <div className="min-h-screen bg-[#F9704E] flex items-center justify-center p-3 sm:p-6" dir="rtl">
      
     <div className="w-full max-w-md bg-[#121214] border-2 border-[#E5C060] rounded-2xl sm:rounded-[28px] p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* دکمه بازگشت به صفحه ثبت نام اختصاصی تورلیدر با سرعت بالا */}
 <button
  type="button"
  onClick={() => {
    const currentSlug = new URLSearchParams(window.location.search).get('slug');
    router.push(currentSlug ? `/?slug=${currentSlug}` : '/');
  }}
  className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-[#F9704E] hover:bg-[#e05f3d] text-white text-[10px] sm:text-xs font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 cursor-pointer"
>
  ← پنل مسافران
</button>
{/* هدر و لوگو */}
<div className="flex flex-col items-center justify-center mb-6">
  <div className="flex items-center justify-center mb-3">
    <img 
      src="/logo.png" 
      alt="Lidera Logo" 
      className="h-8 sm:h-10 w-auto object-contain mx-auto" 
    />
  </div>
  <h1 className="text-base sm:text-lg font-bold text-white text-center tracking-tight">
    به لیدرا خوش آمدید
  </h1>
  <p className="text-zinc-400 text-[11px] sm:text-xs text-center mt-1">
    پلتفرم اختصاصی ورود تور لیدرها
  </p>
</div>

        {/* فرم ورود تورلیدر */}
        <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm text-zinc-400 mb-1 sm:mb-1.5 text-right font-medium">نام کاربری</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="نام کاربری خود را وارد کنید"
              className="w-full bg-zinc-900/90 border border-[#F9704E] rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#F9704E] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm text-zinc-400 mb-1 sm:mb-1.5 text-right font-medium">رمز عبور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="rtl"
              className="w-full bg-zinc-900/90 border border-[#F9704E] rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#F9704E] transition-colors text-right font-mono"
            />
          </div>
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] sm:text-xs py-2 px-3 rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F9704E] hover:bg-[#e05b3a] text-black font-extrabold py-3 sm:py-3.5 rounded-xl transition-all shadow-lg active:scale-95 text-xs sm:text-sm mt-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'در حال بررسی...' : 'ورود به پنل تورلیدر'}
          </button>
        </form>

        <div className="p-3 text-center border-t border-zinc-800/60 mt-5 sm:mt-6">
          <p className="text-[10px] sm:text-[11px] text-zinc-500 font-medium tracking-wide">
            تمام حقوق این پلتفرم برای لیدرا محفوظ است. ۱۴۰۵ ©
          </p>
        </div>

      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9704E] flex items-center justify-center text-white text-xs font-bold" dir="rtl">
        در حال بارگذاری...
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}