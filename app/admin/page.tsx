"use client";
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { 
  FaFileExcel, 
  FaTrash, 
  FaKey, 
  FaSignOutAlt, 
  FaInstagram, 
  FaTelegramPlane, 
  FaWhatsapp, 
  FaPlus, 
  FaSave,
  FaEdit,
  FaLink
} from 'react-icons/fa';
import { MdChat } from 'react-icons/md';

import {
  getLeadersFromDb,
  createLeaderInDb,
  updateLeaderInDb,
  deleteLeaderFromDb,
  updateLeaderStatusInDb,
  resetLeaderPasswordInDb,
  updateAdminPassword,
  deleteAllRecords
} from "@/app/actions/admin-actions";




interface Leader {
  id: string;
  slug: string;
  fullName: string | null;
  username: string;
  mobile: string | null; 
  nationalId: string | null; 
  address?: string | null; 
  password?: string | null;
  instagram?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  rubika?: string | null;
  status: string; 
  blockedAt?: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();

  // 1. استیت‌های مودال تغییر پسورد ادمین
  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  // 2. استیت‌های مودال افزودن لیدر جدید
  const [isAddLeaderModalOpen, setIsAddLeaderModalOpen] = useState(false);
  const [newLeader, setNewLeader] = useState({
    fullName: '',
    username: '',
    nationalId: '', 
    mobile: '', 
    address: '',
    password: '',
    instagram: '',
    telegram: '',
    whatsapp: '',
    rubika: ''
  });

  // 3. استیت‌های مودال ویرایش لیدر
  const [isEditLeaderModalOpen, setIsEditLeaderModalOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);

  // 4. لیست اصلی لیدرها
  const [guides, setGuides] = useState<Leader[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 5. تغییرات وضعیت معلق (پیش از ذخیره)
  const [pendingStatusChanges, setPendingStatusChanges] = useState<Record<string, string>>({});

  useEffect(() => {
    const hasCookie = document.cookie.includes('admin_token=');
    if (!hasCookie) {
      router.push('/admin/login');
      return;
    }

    const fetchGuides = async () => {
      try {
        const res = await getLeadersFromDb() as any;
        if (Array.isArray(res)) {
          setGuides(res);
        } else if (res && Array.isArray(res.data)) {
          setGuides(res.data);
        }
      } catch (error) {
        console.error("Error fetching guides:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuides();
  }, [router]);

  const handleLogout = () => {
    if (confirm('آیا می‌خواهید از پنل مدیریت خارج شوید؟')) {
      localStorage.removeItem('admin_token'); 
      document.cookie = "admin_token=; path=/; max-age=0";
      document.cookie = "admin_status=; path=/; max-age=0";
      router.push('/admin/login'); 
    }
  };

  // افزودن لیدر جدید در دیتابیس
  const handleAddLeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newLeader.fullName || !newLeader.username || !newLeader.mobile) {
      alert('⚠️ لطفاً نام، نام کاربری و شماره موبایل را وارد کنید!');
      return;
    }

    const res = await createLeaderInDb(newLeader, window.location.pathname);

    if (res.success) {
      alert(`✅ لیدر با موفقیت در دیتابیس ثبت شد.`);
      const updatedData = await getLeadersFromDb();
      setGuides(updatedData as any);
      setNewLeader({
        fullName: '', username: '', nationalId: '', mobile: '',
        address: '', password: '', instagram: '', telegram: '', whatsapp: '', rubika: ''
      });
      setIsAddLeaderModalOpen(false);
    } else {
      alert(res.message || '❌ خطا در ثبت لیدر.');
    }
  };

const [formData, setFormData] = useState({
  fullName: "",
  username: "",
  mobile: "",
  nationalId: "",
  // فیلدهای شبکه‌های اجتماعی:
  instagram: "",
  telegram: "",
  whatsapp: "",
  rubika: "",
  // بقیه فیلدها...
});


  // باز کردن مودال ویرایش
  const handleOpenEditModal = (leader: Leader) => {
    setEditingLeader({ ...leader });
    setIsEditLeaderModalOpen(true);
  };

  // ذخیره فرم ویرایش لیدر در دیتابیس
  const handleEditLeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeader) return;

    if (!editingLeader.fullName || !editingLeader.username || !editingLeader.mobile) {
      alert('⚠️ نام، نام کاربری و شماره تماس اجباری هستند!');
      return;
    }

    const res = await updateLeaderInDb(editingLeader, window.location.pathname);

    if (res.success) {
      alert('✅ اطلاعات لیدر با موفقیت در دیتابیس ویرایش شد.');
      const updatedData = await getLeadersFromDb();
      setGuides(updatedData as any);
      setIsEditLeaderModalOpen(false);
      setEditingLeader(null);
    } else {
      alert(res.message || '❌ خطا در ویرایش اطلاعات.');
    }
  };

  // تغییر موقت وضعیت Dropdown
  const handleTempStatusChange = (id: string, newStatus: string) => {
    setPendingStatusChanges(prev => ({
      ...prev,
      [id]: newStatus
    }));
  };

  // ذخیره نهایی تغییرات وضعیت در دیتابیس
  const handleSaveStatusChanges = async () => {
    if (Object.keys(pendingStatusChanges).length === 0) return;

    try {
      for (const [id, status] of Object.entries(pendingStatusChanges)) {
        await updateLeaderStatusInDb(id, status, window.location.pathname);
      }

      const updatedData = await getLeadersFromDb();
      setGuides(updatedData as any);
      setPendingStatusChanges({});
      alert('✅ تغییرات وضعیت و تاریخ مسدودی با موفقیت در دیتابیس ذخیره شد.');
    } catch (error) {
      console.error(error);
      alert('❌ خطا در ذخیره وضعیت‌ها.');
    }
  };

  // تغییر پسورد مدیریت در دیتابیس
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordInput.trim().length < 4) {
      alert('⚠️ رمز عبور باید حداقل ۴ کاراکتر باشد!');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      alert('❌ رمز جدید و تکرار آن یکسان نیستند!');
      return;
    }

const res = await fetch('/api/admin/change-password', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ newPassword: newPasswordInput }),
});
const data = await res.json();

if (res.ok) {
  alert('رمز عبور مدیریت با موفقیت در دیتابیس تغییر کرد 🔒');
  setIsChangePassModalOpen(false);
  setOldPasswordInput('');
  setNewPasswordInput('');
  setConfirmPasswordInput('');
} else {
  alert(data.message || 'خطا در تغییر رمز عبور');
}
  };

  // ریست پسورد لیدر به 123456
  const handleResetLeaderPassword = async (leaderId: string) => {
    if (confirm("آیا از ریست رمز عبور به 123456 مطمئن هستید؟")) {
      const res = await resetLeaderPasswordInDb(leaderId, window.location.pathname);
      if (res.success) {
        alert("🔑 رمز عبور با موفقیت در دیتابیس ریست شد!");
      } else {
        alert(res.message);
      }
    }
  };

  // حذف تک‌تک لیدرها از دیتابیس
  const handleDelete = async (id: string) => {
    if (confirm('آیا از حذف این لیدر از دیتابیس اطمینان دارید؟')) {
      const res = await deleteLeaderFromDb(id, window.location.pathname);
      if (res.success) {
        setGuides(guides.filter(guide => guide.id !== id));
        const newPending = { ...pendingStatusChanges };
        delete newPending[id];
        setPendingStatusChanges(newPending);
        alert('✅ لیدر با موفقیت حذف شد.');
      } else {
        alert(res.message);
      }
    }
  };

// --- حذف کلیه رکوردها از دیتابیس ---
  const handleDeleteAll = async () => {
    if (guides.length === 0) return alert('⚠️ هیچ رکوردی وجود ندارد!');

    if (confirm('🚨 آیا مطمئن هستید که می‌خواهید تمام لیدرها را از دیتابیس پاک کنید؟')) {
      // صدا زدن سرور اکشن برای حذف از دیتابیس
      const res = await deleteAllRecords(window.location.pathname);

      if (res.success) {
        setGuides([]);
        setPendingStatusChanges({});
        alert('🗑️ کلیه اطلاعات با موفقیت از دیتابیس پاک شدند.');
      } else {
        alert(res.message || '❌ خطا در حذف اطلاعات از دیتابیس.');
      }
    }
  };




// --- تولید و کپی لینک اختصاصی تورلیدر ---
  const handleCopyLeaderLink = (username: string) => {
    // ساخت لینک دقیق بر اساس دامنه فعلی و پارامتر slug
    const leaderLink = `${window.location.origin}/?slug=${username}`;

    navigator.clipboard.writeText(leaderLink);
    alert(`🔗 لینک اختصاصی تورلیدر با موفقیت کپی شد:\n${leaderLink}`);
  };


  // خروجی اکسل
  const exportToExcel = () => {
    const dataToExport = guides.map((guide, index) => {
      const currentStatus = pendingStatusChanges[guide.id] ?? guide.status;
      return {
        'ردیف': index + 1,
        'نام و نام خانوادگی': guide.fullName,
        'نام کاربری': guide.username,
        'کد ملی': guide.nationalId,
        'شماره تماس': guide.mobile,
        'آدرس': guide.address || 'ثبت نشده',
        'آیدی اینستاگرام': guide.instagram || 'ثبت نشده',
        'آیدی تلگرام': guide.telegram || 'ثبت نشده',
        'شماره واتساپ': guide.whatsapp || 'ثبت نشده',
        'آیدی روبیکا': guide.rubika || 'ثبت نشده',
        'وضعیت بررسی': currentStatus === 'active' ? 'تایید شده' : currentStatus === 'blocked' ? 'مسدود شده' : 'در انتظار تایید',
        'تاریخ مسدودی': guide.blockedAt ? new Date(guide.blockedAt).toLocaleDateString('fa-IR') : '---',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'لیست تورلیدرها');
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ RTL: true });
    XLSX.writeFile(workbook, 'Lidara_Tour_Guides.xlsx');
  };

  const hasPendingChanges = Object.keys(pendingStatusChanges).length > 0;

  if (isLoading) {
    return <div className="min-h-screen bg-[#121214] flex items-center justify-center text-white">در حال بارگذاری اطلاعات از دیتابیس...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9704E] p-4 sm:p-6 md:p-12 text-white font-sans selection:bg-[#F9704E] selection:text-black" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
   
       {/* هدر اصلی */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#1e1e1e] p-4 sm:p-6 rounded-2xl border-2 border-[#E5C060] shadow-xl text-center md:text-right">
  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
    {/* ابعاد ریسپانسیو لوگو برای موبایل */}
    <div className="relative w-40 sm:w-48 h-17 sm:h-15 mb-3">
      <img
        src="/logo.png"
        className="w-full h-full object-contain"
        alt="Lidara Logo"
      />
    </div>
    <div>
      <h1 className="text-base sm:text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
        پنل مدیریت لیدرا
      </h1>
      <p className="text-zinc-400 mt-0.5 text-[11px] sm:text-sm">
        اتوماسیون هوشمند مدیریت و بررسی اطلاعات راهنمایان
      </p>
    </div>
  </div>


          {/* دکمه‌های ابزار بالای جدول */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsAddLeaderModalOpen(true)}
                title="افزودن لیدر جدید"
                className="flex items-center justify-center bg-[#F9704E] hover:bg-[#e05b3a] text-black p-2.5 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <FaPlus size={16} />
              </button>

              {hasPendingChanges && (
                <button
                  onClick={handleSaveStatusChanges}
                  title={`ذخیره تغییرات وضعیت (${Object.keys(pendingStatusChanges).length})`}
                  className="flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-black p-2.5 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer animate-pulse"
                >
                  <FaSave size={16} />
                </button>
              )}

              <button
                onClick={() => setIsChangePassModalOpen(true)}
                title="تغییر رمز مدیریت"
                className="flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-[#E5C060] p-2.5 rounded-xl transition-all border border-zinc-800 active:scale-95 cursor-pointer"
              >
                <FaKey size={16} />
              </button>

              <button
                onClick={handleDeleteAll}
                title="حذف کلیه رکوردها"
                className="flex items-center justify-center bg-red-950/50 hover:bg-red-900/80 text-red-400 p-2.5 rounded-xl transition-all border border-red-900/40 active:scale-95 cursor-pointer"
              >
                <FaTrash size={16} />
              </button>
            
              <button
                onClick={exportToExcel}
                title="خروجی اکسل (Excel)"
                className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <FaFileExcel size={16} />
              </button>
            </div>
                 
            <button
              onClick={handleLogout}
              title="خروج از پنل"
              className="flex items-center justify-center bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 p-2.5 rounded-xl transition-all border border-rose-900/30 active:scale-95 cursor-pointer"
            >
              <FaSignOutAlt size={16} />
            </button>
          </div>
        </div>
       
        {/* ----------------- نمایش موبایل (Mobile Cards) ----------------- */}
        <div className="block md:hidden space-y-4">
          {guides.length === 0 ? (
            <div className="text-center py-12 bg-[#1e1e1e] rounded-2xl border-2 border-[#E5C060] text-white text-sm">
              هیچ لیدری ثبت نشده است.
            </div>
          ) : (
            guides.map((guide) => {
              const currentStatus = pendingStatusChanges[guide.id] ?? guide.status;
              const isChanged = pendingStatusChanges[guide.id] !== undefined && pendingStatusChanges[guide.id] !== guide.status;

              return (
               <div key={guide.id} className="bg-[#1e1e1e] border-2 border-[#FFD700] hover:border-amber-400 rounded-2xl p-5 shadow-lg shadow-amber-500/10 space-y-4 transition-all">
                  
                 <div className="flex items-center justify-between border-b border-[#F9704E]/30 pb-3 gap-2">
                    <div>
                      <h3 className="font-bold text-white text-base">{guide.fullName}</h3>
                      <p className="text-xs text-[#FFD700] mt-1 font-mono">نام کاربری: {guide.username}</p>
                      <p className="text-xs text-zinc-400 mt-1">کد ملی: <span className="font-mono text-zinc-300">{guide.nationalId || '---'}</span></p>
                      <p className="text-xs text-zinc-400 mt-0.5">همراه: <span className="font-mono text-zinc-300">{guide.mobile}</span></p>
                      {guide.address && (
                        <p className="text-xs text-zinc-500 mt-1">📍 {guide.address}</p>
                      )}
                    </div>
                    
{/* کانتینر دکمه‌های بالای پنل مدیریت */}
<div className="flex items-center justify-center gap-1.5 sm:gap-3 my-3">
  {/* دکمه‌ها */}
  <button className="p-2 sm:p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl active:scale-95 transition-all" title="خروجی اکسل">
    <FaFileExcel size={18} />
  </button>
  
  <button className="p-2 sm:p-2.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl active:scale-95 transition-all" title="حذف">
    <FaTrash size={18} />
  </button>

  <button className="p-2 sm:p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl active:scale-95 transition-all" title="تغییر رمز">
    <FaKey size={18} />
  </button>

  <button className="p-2 sm:p-2.5 bg-[#F9704E]/20 text-[#F9704E] border border-[#F9704E]/30 rounded-xl active:scale-95 transition-all" title="افزودن">
    <FaPlus size={18} />
  </button>

  {/* دکمه خروج */}
  <button className="p-2 sm:p-2.5 bg-rose-900/40 text-rose-300 border border-rose-800/50 rounded-xl active:scale-95 transition-all" title="خروج">
    <FaSignOutAlt size={18} />
  </button>
</div>
</div>
              {/* شبکه‌های اجتماعی */}
<div className="flex items-center justify-between bg-zinc-900/80 p-3 rounded-xl border border-[#F9704E]">
  <span className="text-xs text-zinc-400">ارتباط:</span>
  <div className="flex items-center gap-3" dir="ltr">
    {guide.instagram ? <a href={`https://instagram.com/${guide.instagram}`} target="_blank" rel="noreferrer" className="text-pink-500"><FaInstagram size={18} /></a> : <FaInstagram size={18} className="text-white/10" />}
    {guide.telegram ? <a href={`https://t.me/${guide.telegram}`} target="_blank" rel="noreferrer" className="text-sky-400"><FaTelegramPlane size={18} /></a> : <FaTelegramPlane size={18} className="text-white/10" />}
    {guide.whatsapp ? <a href={`https://wa.me/${guide.whatsapp}`} target="_blank" rel="noreferrer" className="text-emerald-400"><FaWhatsapp size={18} /></a> : <FaWhatsapp size={18} className="text-white/10" />}
    {guide.rubika ? <a href={`https://rubika.ir/${guide.rubika}`} target="_blank" rel="noreferrer" className="text-red-500"><MdChat size={18} /></a> : <MdChat size={18} className="text-white/10" />}
  </div>
</div>
                  {/* وضعیت دسترسی */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-zinc-400">
                      وضعیت: {isChanged && <span className="text-amber-400 text-[10px]">(ذخیره‌نشده)</span>}
                    </span>
                    <select
                      value={currentStatus}
                      onChange={(e) => handleTempStatusChange(guide.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all bg-zinc-900 text-white ${
                        currentStatus === 'active' ? 'border-emerald-500/40 text-emerald-400' : currentStatus === 'blocked' ? 'border-rose-500/40 text-rose-400' : 'border-amber-500/40 text-amber-400'
                      }`}
                    >
                      <option value="pending">در انتظار تایید</option>
                      <option value="active">تایید شده (فعال)</option>
                      <option value="blocked">مسدود شده</option>
                    </select>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* ----------------- نمایش دسکتاپ (Table) ----------------- */}
        <div className="hidden md:block bg-[#1e1e1e] rounded-2xl  border-2 border-[#E5C060] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-black border-b-2 border-[#F9704E] text-white text-sm">
                  <th className="p-5 font-bold">اطلاعات تورلیدر</th>
                  <th className="p-5 font-bold">نام کاربری & کد ملی</th>
                  <th className="p-5 font-bold text-center">ارتباط</th>
                  <th className="p-5 font-bold text-center">وضعیت دسترسی</th>
                  <th className="p-5 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {guides.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500 text-sm">
                      هیچ لیدری ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  guides.map((guide) => {
                    const currentStatus = pendingStatusChanges[guide.id] ?? guide.status;
                    const isChanged = pendingStatusChanges[guide.id] !== undefined && pendingStatusChanges[guide.id] !== guide.status;

                    return (
                      <tr key={guide.id} className={`hover:bg-zinc-900/50 transition-colors ${isChanged ? 'bg-amber-500/5' : ''}`}>
                        <td className="p-5">
                          <div className="font-bold text-white text-base">{guide.fullName}</div>
                          <div className="text-xs text-zinc-400 mt-1">📱 همراه: {guide.mobile}</div>
                          <div className="text-xs text-zinc-500 mt-1 max-w-xs truncate" title={guide.address || ''}>
                            {guide.address ? `📍 ${guide.address}` : 'آدرس ثبت نشده'}
                          </div>
                        </td>

                        <td className="p-5">
                          <div className="text-sm font-mono text-[#F9704E] font-bold">{guide.username}</div>
                          <div className="text-xs font-mono text-zinc-400 mt-1">کد ملی: {guide.nationalId || '---'}</div>
                        </td>

                        <td className="p-5">
                          <div className="flex justify-center items-center gap-4">
                            {guide.instagram ? <a href={`https://instagram.com/${guide.instagram}`} target="_blank" rel="noreferrer" className="text-pink-500 hover:text-pink-400"><FaInstagram size={20} /></a> : <FaInstagram size={20} className="text-white/10" />}
                            {guide.telegram ? <a href={`https://t.me/${guide.telegram}`} target="_blank" rel="noreferrer" className="text-sky-400 hover:text-sky-300"><FaTelegramPlane size={20} /></a> : <FaTelegramPlane size={20} className="text-white/10" />}
                            {guide.whatsapp ? <a href={`https://wa.me/${guide.whatsapp}`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300"><FaWhatsapp size={20} /></a> : <FaWhatsapp size={20} className="text-white/10" />}
                            {guide.rubika ? <a href={`https://rubika.ir/${guide.rubika}`} target="_blank" rel="noreferrer" className="text-red-500 hover:text-red-400"><MdChat size={20} /></a> : <MdChat size={20} className="text-white/10" />}
                          </div>
                        </td>

                        <td className="p-5 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <select
                              value={currentStatus}
                              onChange={(e) => handleTempStatusChange(guide.id, e.target.value)}
                              className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer bg-zinc-900 text-white ${
                                currentStatus === 'active' ? 'border-emerald-500/30 text-emerald-400' : currentStatus === 'blocked' ? 'border-rose-500/30 text-rose-400' : 'border-amber-500/30 text-amber-400'
                              }`}
                            >
                              <option value="pending">در انتظار تایید</option>
                              <option value="active">تایید شده (فعال)</option>
                              <option value="blocked">مسدود شده</option>
                            </select>
                            
                            {guide.status === 'blocked' && guide.blockedAt && (
                              <span className="text-[10px] text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/30 font-mono">
                                مسدودی: {new Date(guide.blockedAt).toLocaleDateString('fa-IR')}
                              </span>
                            )}

                            {isChanged && <span className="text-[10px] text-amber-400 font-bold">ذخیره‌نشده</span>}
                          </div>
                        </td>

                        <td className="p-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleCopyLeaderLink(guide.username)}
                              className="p-2 text-emerald-400 hover:text-emerald-400 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              title="کپی لینک اختصاصی"
                            >
                              <FaLink size={15} />
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(guide)}
                              className="p-2 text-sky-400 hover:text-sky-400 rounded-lg hover:bg-sky-500/10 transition-colors cursor-pointer"
                              title="ویرایش اطلاعات"
                            >
                              <FaEdit size={16} />
                            </button>

                            <button
                              onClick={() => handleResetLeaderPassword(guide.id)}
                              className="p-2 text-amber-400  hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                              title="ریست پسورد"
                            >
                              <FaKey size={14} />
                            </button>

                            <button
                              onClick={() => handleDelete(guide.id)}
                              className="p-2 text-rose-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ----------------- ➕ مودال افزودن لیدر جدید ----------------- */}
        {isAddLeaderModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" dir="rtl">
    <div className="bg-[#121214] border-2 border-[#E5C060] rounded-2xl w-full max-w-lg p-6 shadow-2xl my-8">
      <h2 className="text-base font-bold mb-4 text-[#F9704E] flex items-center gap-2 border-b border-zinc-800 pb-3">
        <FaPlus /> افزودن تورلیدر جدید به دیتابیس
      </h2>

      <form onSubmit={handleAddLeaderSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-300 mb-1 font-medium">نام و نام خانوادگی *</label>
            <input
              type="text"
              required
              value={newLeader.fullName}
              onChange={e => setNewLeader({ ...newLeader, fullName: e.target.value })}
              className="w-full bg-zinc-300 border border-orange-600 rounded-xl px-3.5 py-2 text-xs text-black placeholder-#F9704E focus:outline-none"
              placeholder="مثال: علی رضایی"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-300 mb-1 font-medium">نام کاربری (انگلیسی) *</label>
            <input
              type="text"
              required
              value={newLeader.username}
              onChange={e => setNewLeader({ ...newLeader, username: e.target.value })}
              className="w-full bg-zinc-300 border border-orange-600 rounded-xl px-3.5 py-2 text-xs text-black placeholder-#F9704E  focus:outline-none font-mono text-left"
              placeholder="ali_rezaei"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-300 mb-1 font-medium">شماره همراه *</label>
            <input
              type="text"
              required
              value={newLeader.mobile}
              onChange={e => setNewLeader({ ...newLeader, mobile: e.target.value })}
              className="w-full bg-zinc-300 border border-orange-600 rounded-xl px-3.5 py-2 text-xs text-black placeholder-#F9704E  focus:outline-none font-mono text-left"
              placeholder="09123456789"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-300 mb-1 font-medium">کد ملی</label>
            <input
              type="text"
              value={newLeader.nationalId}
              onChange={e => setNewLeader({ ...newLeader, nationalId: e.target.value })}
              className="w-full bg-zinc-300 border border-orange-600 rounded-xl px-3.5 py-2 text-xs text-black placeholder-#F9704E  focus:outline-none font-mono text-left"
              placeholder="0012345678"
            />
          </div>
        </div>

        {/* فیلدهای شبکه‌های اجتماعی */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-300 mb-1 font-medium">آیدی اینستاگرام</label>
            <input
              type="text"
              value={newLeader.instagram || ''}
              onChange={e => setNewLeader({ ...newLeader, instagram: e.target.value })}
              className="w-full bg-zinc-300 border border-orange-600 rounded-xl px-3.5 py-2 text-xs text-black placeholder-#F9704E  focus:outline-none font-mono text-left"
              placeholder="instagram_id"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-300 mb-1 font-medium">آیدی تلگرام</label>
            <input
              type="text"
              value={newLeader.telegram || ''}
              onChange={e => setNewLeader({ ...newLeader, telegram: e.target.value })}
              className="w-full bg-zinc-300 border border-orange-600 rounded-xl px-3.5 py-2 text-xs text-black placeholder-#F9704E  focus:outline-none font-mono text-left"
              placeholder="telegram_id"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-300 mb-1 font-medium">شماره واتس‌اپ</label>
            <input
              type="text"
              value={newLeader.whatsapp || ''}
              onChange={e => setNewLeader({ ...newLeader, whatsapp: e.target.value })}
              className="w-full bg-zinc-300 border border-orange-600 rounded-xl px-3.5 py-2 text-xs text-black placeholder-#F9704E   focus:outline-none font-mono text-left"
              placeholder="989123456789"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-300 mb-1 font-medium">آیدی روبیکا</label>
            <input
              type="text"
              value={newLeader.rubika || ''}
              onChange={e => setNewLeader({ ...newLeader, rubika: e.target.value })}
              className="w-full bg-zinc-300 border border-orange-600 rounded-xl px-3.5 py-2 text-xs text-black placeholder-#F9704E focus:outline-none font-mono text-left"
              placeholder="rubika_id"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-300 mb-1 font-medium">رمز عبور اولیه</label>
          <input
            type="text"
            value={newLeader.password}
            onChange={e => setNewLeader({ ...newLeader, password: e.target.value })}
            className="w-full bg-zinc-300 border border-orange-600 rounded-xl px-3.5 py-2 text-xs text-black placeholder-#F9704E focus:outline-none font-mono text-left"
            placeholder="پیش‌فرض: 123456"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-300 mb-1 font-medium">آدرس / استان و شهر</label>
          <textarea
            rows={2}
            value={newLeader.address}
            onChange={e => setNewLeader({ ...newLeader, address: e.target.value })}
            className="w-full bg-zinc-300 border border-orange-600 rounded-xl p-3 text-xs text-black placeholder-#F9704E focus:outline-none"
            placeholder="تهران، ..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => setIsAddLeaderModalOpen(false)}
            className="bg-zinc-500 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="submit"
            className="bg-[#F9704E] hover:bg-[#e05f3e] text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-lg"
          >
            ثبت در دیتابیس
          </button>
        </div>
      </form>
    </div>
  </div>
)}

        {/* ----------------- ✏️ مودال ویرایش اطلاعات لیدر ----------------- */}
        {isEditLeaderModalOpen && editingLeader && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-[#1e1e1e] border-2 border-[#E5C060] rounded-2xl w-full max-w-lg p-6 shadow-2xl my-8" dir="rtl">
              <h2 className="text-base font-bold mb-4 text-[#F9704E] flex items-center gap-2 border-b border-zinc-800 pb-3">
                <FaEdit /> ویرایش اطلاعات لیدر: {editingLeader.fullName}
              </h2>

              <form onSubmit={handleEditLeaderSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">نام و نام خانوادگی *</label>
                    <input
                      type="text"
                      required
                      value={editingLeader.fullName || ''}
                      onChange={e => setEditingLeader({ ...editingLeader, fullName: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#F9704E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">نام کاربری *</label>
                    <input
                      type="text"
                      required
                      value={editingLeader.username || ''}
                      onChange={e => setEditingLeader({ ...editingLeader, username: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#F9704E] font-mono text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">شماره همراه *</label>
                    <input
                      type="text"
                      required
                      value={editingLeader.mobile || ''}
                      onChange={e => setEditingLeader({ ...editingLeader, mobile: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#F9704E] font-mono text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">کد ملی</label>
                    <input
                      type="text"
                      value={editingLeader.nationalId || ''}
                      onChange={e => setEditingLeader({ ...editingLeader, nationalId: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#F9704E] font-mono text-left"
                    />
                  </div>
                </div>

                {/* فیلدهای شبکه‌های اجتماعی */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">آیدی اینستاگرام</label>
                    <input
                      type="text"
                      value={editingLeader.instagram || ''}
                      onChange={e => setEditingLeader({ ...editingLeader, instagram: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#F9704E] font-mono text-left"
                      placeholder="instagram_id"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">آیدی تلگرام</label>
                    <input
                      type="text"
                      value={editingLeader.telegram || ''}
                      onChange={e => setEditingLeader({ ...editingLeader, telegram: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#F9704E] font-mono text-left"
                      placeholder="telegram_id"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">شماره واتس‌اپ</label>
                    <input
                      type="text"
                      value={editingLeader.whatsapp || ''}
                      onChange={e => setEditingLeader({ ...editingLeader, whatsapp: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#F9704E] font-mono text-left"
                      placeholder="989123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">آیدی روبیکا</label>
                    <input
                      type="text"
                      value={editingLeader.rubika || ''}
                      onChange={e => setEditingLeader({ ...editingLeader, rubika: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#F9704E] font-mono text-left"
                      placeholder="rubika_id"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">آدرس / استان و شهر</label>
                  <textarea
                    rows={2}
                    value={editingLeader.address || ''}
                    onChange={e => setEditingLeader({ ...editingLeader, address: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F9704E]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsEditLeaderModalOpen(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="bg-[#F9704E] hover:bg-[#e05b3a] text-black font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    ذخیره تغییرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- 🔐 مودال تغییر پسورد ادمین ----------------- */}
        {isChangePassModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl" dir="rtl">
              <h2 className="text-base font-bold mb-4 text-[#E5C060] flex items-center gap-2 border-b border-zinc-800 pb-3">
                <FaKey /> تغییر رمز عبور مدیریت
              </h2>

              <form onSubmit={handleChangeAdminPassword} className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">رمز عبور جدید *</label>
                  <input
                    type="password"
                    required
                    value={newPasswordInput}
                    onChange={e => setNewPasswordInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E5C060]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">تکرار رمز عبور جدید *</label>
                  <input
                    type="password"
                    required
                    value={confirmPasswordInput}
                    onChange={e => setConfirmPasswordInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E5C060]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsChangePassModalOpen(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="bg-[#E5C060] hover:bg-[#d4b055] text-black font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    تغییر رمز عبور
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}