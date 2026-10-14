"use client";
export const dynamic = 'force-dynamic';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loginAdminAction } from '@/app/actions/admin-actions';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginAdminAction(username.trim(), password);

if (res && res.success) {
        document.cookie = "admin_token=admin-session; path=/; max-age=86400";
        document.cookie = "token=admin-session; path=/; max-age=86400";
        
        // تغییر قطعی و اجباری صفحه توسط مرورگر
        window.location.href = '/admin';
   router.refresh();

      }

 else {
        setError(res?.message || '❌ شناسه مدیریتی یا رمز عبور اشتباه است!');
      }
    } catch (err: any) {
      console.error("Login Page Error:", err);
      setError('❌ خطایی در ارتباط با سرور رخ داد. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9704E] text-white flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md bg-[#121215] border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/40 my-auto transition-all">
        
<div className="flex flex-col items-center text-center mb-6 sm:mb-8">
<div className="relative w-32 h-12 mb-3">
  <img
    src="/logo.png"
      className="w-full h-full object-contain"
  />
  </div>
  <span className="inline-block px-3.5 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-xs font-bold mb-3 tracking-wide">
    بخش محرمانه / پنل ارشد
  </span>
  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
    ورود مدیر سیستم لیدرا
  </h1>
</div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 font-medium pr-1">
              شناسه مدیریتی
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="نام کاربری"
              className="w-full bg-[#0a0a0c] border border-neutral-800 focus:border-red-500 p-3.5 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 font-medium pr-1">
              رمز عبور ارشد
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="left"
              className="w-full bg-[#0a0a0c] border border-neutral-800 focus:border-red-500 p-3.5 rounded-xl text-xs text-white text-left placeholder-neutral-600 focus:outline-none transition-colors font-mono"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-2.5 px-4 rounded-xl text-center font-medium leading-relaxed">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-lg shadow-red-950/50 cursor-pointer mt-2 disabled:opacity-50"
          >
            {loading ? 'در حال بررسی...' : 'ورود به پنل مدیریت'}
          </button>
        </form>

      </div>
    </div>
  );
}