'use client';
import React, { useState } from 'react';

// همان آدرسی که مودال داخل LeaderDashboard صدا می‌زند
const CHANGE_PASSWORD_URL = '/api/leaders/change-password';

export default function ForcePasswordGate({ slug }: { slug: string }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rules = [
    { ok: newPassword.length >= 8, text: 'حداقل ۸ کاراکتر' },
    { ok: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword), text: 'شامل حروف بزرگ و کوچک انگلیسی' },
    { ok: /\d/.test(newPassword), text: 'شامل حداقل یک عدد' },
    { ok: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword), text: 'شامل کاراکتر خاص (مثل !@#$)' },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('رمز جدید و تکرار آن یکسان نیستند.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(CHANGE_PASSWORD_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // بارگذاری کامل: صفحه‌ی سروری دوباره از دیتابیس می‌خواند و پنل باز می‌شود
        window.location.assign(`/leader?slug=${encodeURIComponent(slug)}`);
        return;
      }
      setError(data.message || 'خطا در تغییر رمز');
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/login-leader', { method: 'DELETE' });
    } catch {}
    window.location.assign(`/login?slug=${encodeURIComponent(slug)}`);
  };

  const input =
    'w-full bg-zinc-900 border border-[#F9704E] rounded-xl p-2.5 text-xs text-white';

  return (
    <div className="min-h-screen bg-[#F9704E]  flex items-center justify-center p-4" dir="rtl">
      <div className="bg-[#1e1e1e] border-2 border-[#E5C060] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <h1 className="text-sm font-bold text-white pb-3 mb-3 border-b border-[#F9704E]">
          تغییر رمز عبور (الزامی)
        </h1>
        <p className="text-zinc-400 text-[11px] leading-6 mb-4">
          این اولین ورود شماست. برای امنیت حساب، قبل از ورود به پنل باید رمز موقت را تغییر دهید.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[11px] text-zinc-300 mb-1">رمز عبور فعلی (موقت):</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={input} />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-300 mb-1">رمز عبور جدید</label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={input} />
            <div className="text-xs space-y-1 mt-2">
              {rules.map((r) => (
                <p key={r.text} className={r.ok ? 'text-green-500 font-medium' : 'text-zinc-500'}>✓ {r.text}</p>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-zinc-300 mb-1">تکرار رمز عبور جدید:</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
          </div>
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] py-2 px-3 rounded-xl text-center">{error}</div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-[#F9704E] text-zinc-950 font-bold py-2.5 rounded-xl text-xs disabled:opacity-50 cursor-pointer">
            {loading ? 'در حال ذخیره...' : 'بروزرسانی رمز و ورود به پنل'}
          </button>
        </form>
        <button type="button" onClick={logout} className="w-full mt-3 text-[11px] text-zinc-400 hover:text-white underline cursor-pointer">
          خروج از حساب
        </button>
      </div>
    </div>
  );
}