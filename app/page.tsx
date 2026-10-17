"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef, Suspense } from 'react';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { submitPassengerAction } from '@/app/actions/admin-actions';

const p2e = (s: any) => (s != null && typeof s === 'string' ? s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()) : '');

function getTenantFromHost(host: string | null): string | null {
  if (!host) return null;
  const currentHost = host.split(':')[0];

  if (currentHost.includes('lidera.myproweb.ir') || currentHost.includes('myproweb.ir')) {
    const parts = currentHost.split('.');
    if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'lidera') {
      return parts[0];
    }
  } else if (currentHost.includes('localhost')) {
    const parts = currentHost.split('.');
    if (parts.length > 1) return parts[0];
  }
  return null;
}

function TourForm() {
  const router = useRouter();
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [currentLider, setCurrentLider] = useState<any>(null);
  const [isLoadingLeader, setIsLoadingLeader] = useState(true);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [selectedTour, setSelectedTour] = useState('');
  const [seatsCount, setSeatsCount] = useState('1');
  const [idCardImage, setIdCardImage] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [idCardError, setIdCardError] = useState<string | null>(null);
   const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const handleRemoveIdCard = () => {
    setIdCardImage(null);
    if (idCardPreview) {
      URL.revokeObjectURL(idCardPreview);
    }
    setIdCardPreview(null);
    setIdCardError(null);
    if (idCardInputRef.current) {
      idCardInputRef.current.value = '';
    }
  };

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      let slug = getTenantFromHost(window.location.host);
      if (!slug) {
        slug = searchParams.get('leader') || searchParams.get('slug');
      }
      setTenantSlug(slug);
    }
  }, [searchParams]);

  useEffect(() => {
    // اگر اسلاگ وجود نداشت، سریع لودینگ را بردار تا صفحه سیاه نماند
    if (!tenantSlug) {
      setIsLoadingLeader(false);
      return;
    }

    let isMounted = true; // برای جلوگیری از پردازش‌های اضافی هنگام جابجایی سریع

    const fetchLeaderFromDb = async () => {
      try {
        const res = await fetch(`/api/leader-info?slug=${tenantSlug}`, {
          cache: 'no-store' // جلوگیری از کش شدن ناقص جهت دریافت آنی اطلاعات جدید
        });
        const data = await res.json();
        
        if (isMounted && data && data.success && data.leader) {
          setCurrentLider(data.leader);
          if (data.leader.tours && data.leader.tours.length > 0) {
            setSelectedTour(data.leader.tours[0].id || data.leader.tours[0]._id);
          }
        }
      } catch (error) {
        console.error("خطا در دریافت اطلاعات لیدر از دیتابیس", error);
      } finally {
        if (isMounted) {
          setIsLoadingLeader(false);
        }
      }
    };

    fetchLeaderFromDb();

    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  const maxSize = 5 * 1024 * 1024;

 const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdCardError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > maxSize) {
        setIdCardError("❌ حجم عکس کارت ملی بیش از ۵ مگابایت است.");
        setIdCardImage(null);
        if (idCardPreview) URL.revokeObjectURL(idCardPreview);
        setIdCardPreview(null);
        return;
      }
      if (idCardPreview) URL.revokeObjectURL(idCardPreview);
      setIdCardImage(file);
      setIdCardPreview(URL.createObjectURL(file));
    }
  };

const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setReceiptError(null);
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    if (file.size > maxSize) {
      setReceiptError("حجم عکس فیش بیش از ۵ مگابایت است ❌");
      setReceiptImage(null);
      setReceiptPreview(null);
      return;
    }
    
    // تبدیل فایل به Base64 برای ذخیره قطعی در دیتابیس و نمایش در پنل لیدر
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setReceiptImage(base64String);
      setReceiptPreview(base64String);
    };
    reader.readAsDataURL(file);
  }
};

  const handleCopyCard = (cardNumber: string) => {
    navigator.clipboard.writeText(cardNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isPhoneValid = /^09\d{9}$/.test(phone);
  const isIdValid = /^\d{10}$/.test(nationalId);

  const isStepValid = () => {
    if (step === 1) return selectedTour !== '';
    if (step === 2) {
      return fullName.trim() !== '' && isPhoneValid && isIdValid && !idCardError;
    }
    if (step === 3) return receiptImage !== null && !receiptError;
    return false;
  };

  const getValidationHint = () => {
    if (step === 1 && !selectedTour) return "لطفاً ابتدا یک تور انتخاب کنید.";
    if (step === 2) {
      if (!fullName.trim()) return "✍️ لطفاً نام و نام خانوادگی را وارد کنید.";
      if (!phone) return "📱 لطفاً شماره موبایل را وارد کنید.";
      if (!isPhoneValid) return "⚠️ شماره موبایل باید ۱۱ رقم باشد و با 09 شروع شود.";
      if (!nationalId) return "🪪 لطفاً کد ملی را وارد کنید.";
      if (!isIdValid) return "⚠️ کد ملی وارد شده ناقص است و باید ۱۰ رقم باشد.";
      if (idCardError) return idCardError;
    }
    if (step === 3) {
      if (!receiptImage) return "🧾 لطفاً عکس فیش واریزی را بارگذاری کنید.";
      if (receiptError) return receiptError;
    }
    return null;
  };

  const nextStep = () => {
    if (isStepValid() && step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStepValid()) return;

    setIsSubmitting(true);

    const tourObj = currentLider?.tours?.find((t: any) => (t.id || t._id) === selectedTour);
    const tourTitle = tourObj ? `${tourObj.title || tourObj.name} (${tourObj.date || ''})` : 'تور عمومی';

    try {
      const res = await submitPassengerAction({
        fullName: fullName.trim(),
        mobile: phone.trim(),
        nationalId: nationalId.trim(),
        tourName: tourTitle,
        seatsCount: seatsCount,
        leaderSlug: tenantSlug || currentLider?.slug || 'default',
        tenantId: tenantSlug || currentLider?.slug || 'default',
        idCardImage: idCardPreview || null,
        receiptImage: receiptPreview || null
      });

      if (res && res.success) {
        setIsSuccess(true);
      } else {
        alert(res?.message || 'خطا در ثبت اطلاعات.');
      }
    } catch (error) {
      console.error('خطا در ثبت اطلاعات مسافر:', error);
      alert('خطای سرور در ثبت نام.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFullName('');
    setPhone('');
    setNationalId('');
    setSeatsCount('1');
    if (idCardPreview) URL.revokeObjectURL(idCardPreview);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setIdCardImage(null);
    setIdCardPreview(null);
    setIdCardError(null);
    setReceiptImage(null);
    setReceiptPreview(null);
    setReceiptError(null);
    setStep(1);
    if (currentLider && currentLider.tours?.length > 0) {
      setSelectedTour(currentLider.tours[0].id || currentLider.tours[0]._id);
    }
    setIsSuccess(false);
  };

  const activeColor = currentLider?.primaryColor || '#e60a0ad8';
  const currentTourDetails = currentLider?.tours?.find((t: any) => (t.id || t._id) === selectedTour);

  const calculateTotalPrice = () => {
    if (!currentTourDetails) return "۰ تومان";

    let englishDigits = p2e(currentTourDetails.price);
    const cleanPriceString = englishDigits.replace(/[^0-9]/g, '');

    const pricePerSeat = parseInt(cleanPriceString, 10);
    const seats = parseInt(seatsCount, 10);

    if (isNaN(pricePerSeat) || isNaN(seats)) {
      return "۰ تومان";
    }

    const total = pricePerSeat * seats;
    return total.toLocaleString('fa-IR') + " تومان";
  };

if (!isMounted || isLoadingLeader) {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white text-xs">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p>در حال بارگذاری اطلاعات...</p>
      </div>
    </div>
  );
}

// حتماً بررسی کن که لودینگ تمام شده باشد و بعد خطای عدم وجود تورلیدر را نشان دهی
// ۱. اول لودینگ و صفحه خوش‌آمدگویی چک می‌شود
  if (!isMounted || isLoadingLeader) {
    return (
      <div className="min-h-screen bg-[#F9704E] flex items-center justify-center p-3 sm:p-6" dir="rtl">
         <div className="w-full max-w-lg bg-[#121215] border-2 border-[#E5C060] rounded-[28px] sm:rounded-[28px] p-5 sm:p-8 overflow-hidden shadow-2xl shadow-black/80 my-2">

          
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-lg font-bold text-white mt-1">به پلتفرم لیدرا خوش آمدید</h1>
            <p className="text-zinc-400 text-xs mt-1">در حال آماده‌سازی اطلاعات تور...</p>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F9704E] mx-auto mb-3"></div>
            <p className="text-xs text-zinc-300 font-medium">لطفاً چند لحظه صبر کنید...</p>
          </div>

          <div className="p-3 text-center border-t border-zinc-800/60 mt-4">
            <p className="text-[10px] text-zinc-500 font-medium tracking-wide">
              تمام حقوق این پلتفرم برای لیدرا محفوظ است. ۱۴۰۵ ©
            </p>
          </div>

        </div>
      </div>
    );
  }

const handleRemoveReceipt = () => {
  setReceiptPreview(null);
  if (receiptInputRef.current) {
    receiptInputRef.current.value = "";
  }
};


  // ۲. بعد از اتمام لودینگ، اگر واقعاً تورلیدری پیدا نشد خطای معتبر نبودن لینک را بده
  if (!currentLider) {
    return (
      <div className="min-h-screen bg-[#121214] text-white flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="text-center p-6 bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm">
          <h2 className="text-base font-bold text-[#F9704E] mb-2">لینک معتبر نیست</h2>
          <p className="text-xs text-neutral-400">تورلیدر مورد نظر یافت نشد یا لینک منقضی شده است.</p>
        </div>
      </div>
    );
  }

return (
  <div className="min-h-screen bg-[#F9704E] text-white p-4 flex flex-col items-center justify-center" dir="rtl">
    <div className="w-full max-w-lg bg-[#121215] border-2 border-[#E5C060] rounded-[28px] sm:rounded-[28px] p-5 sm:p-8 overflow-hidden shadow-2xl shadow-black/80 my-2">
{/* هدر لیدر و لوگو اصلاح شده کاملاً ریسپانسیو */}
<div className="p-2.5 sm:p-4 border-2 border-[#E5C060] rounded-[20px] sm:rounded-24px flex flex-row items-center justify-between bg-neutral-900/20 gap-2 sm:gap-4 w-full overflow-hidden">
  
  {/* ۱. سمت راست: لوگو */}
<div className="flex items-center justify-start shrink-0 ml-3 sm:ml-4">
  <img 
    src="/logo.png" 
    className="h-10 sm:h-12 md:h-14 w-auto object-contain" 
    alt="Lidera Logo" 
  />
</div>

  {/* ۲. وسط: نام و عنوان لیدر */}
<div className="text-right flex-1 min-w-0 px-1 pl-6">
    <h1 className="text-xs sm:text-base md:text-lg font-bold text-white tracking-tight ">
      {currentLider.fullName || currentLider.name}
    </h1>
    <p className="text-[8px] sm:text-xs font-base text-neutral-400 mt-0.5 truncate ">
      {currentLider.title || currentLider.brandName || 'تورلیدر رسمی'}
    </p>
  </div>

  {/* ۳. سمت چپ: دکمه ورود لیدر */}
  <div className="flex items-center justify-end shrink-0">
    <a
      href={`/login${window.location.search}`}
      className="flex items-center justify-center px-1.5 sm:px-3 py-1 sm:py-1.5 bg-[#F9704E] text-white rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 text-[10px] sm:text-xs font-bold border border-[#F9704E] whitespace-nowrap"
      title="ورود تورلیدر"
    >
      ورود لیدر
    </a>
  </div>

</div>


{!isSuccess && (
  <div className="px-2 pt-3 pb-2 flex items-center justify-center gap-4 sm:gap-4 text-[11px] font-bold text-neutral-400 w-full max-w-md mx-auto">
    
    {/* استپ ۱ */}
    <div className="flex items-center gap-2.5 shrink-0">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-[#F9704E] text-white' : 'bg-[#F9704E] text-neutral-500'}`}>1</span>
      <span className={step >= 1 ? 'text-white' : ''}>انتخاب تور</span>
    </div>

    {/* خط رابط ۱ */}
    <div className="h-[2px] flex-1 bg-neutral-800 max-w-[40px]">
      <div className="h-full bg-[#F9704E] transition-all duration-300" style={{ width: step > 1 ? '100%' : '0%' }}></div>
    </div>

    {/* استپ ۲ */}
    <div className="flex items-center gap-2.5 shrink-0">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-[#F9704E] text-white' : 'bg-[#F9704E] text-neutral-500'}`}>2</span>
      <span className={step >= 2 ? 'text-white' : ''}>مشخصات</span>
    </div>

    {/* خط رابط ۲ */}
    <div className="h-[2px] flex-1 bg-neutral-800 max-w-[40px]">
      <div className="h-full bg-[#F9704E] transition-all duration-300" style={{ width: step > 2 ? '100%' : '0%' }}></div>
    </div>

    {/* استپ ۳ */}
    <div className="flex items-center gap-2.5 shrink-0">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-[#F9704E] text-white' : 'bg-[#F9704E] text-neutral-500'}`}>3</span>
      <span className={step >= 3 ? 'text-white' : ''}>پرداخت</span>
    </div>

  </div>
)}

      <div className="p-2">
        {isSuccess ? (
          <div className="text-center py-8 space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl font-bold mx-auto">✓</div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-emerald-400">اطلاعات و فیش شما ثبت شد</h3>
              <p className="text-xs font-medium text-neutral-300 leading-relaxed px-4">
                ثبت‌نام شما پس از بررسی مدارک و فیش واریزی توسط لیدر تایید و پیامک هماهنگی ارسال خواهد شد.
              </p>
            </div>
            <button onClick={handleReset} className="text-xs font-bold px-6 py-3 rounded-xl bg-[#F9704E] hover:bg-[#F9704E] text-white border-b-2 border-[#F9704E]  transition-all duration-200 mt-4 mx-auto block active:scale-95">
              ثبت‌نام جدید
            </button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white mb-2 font-medium">انتخاب تور اختصاصی</label>
                  {currentLider?.tours && currentLider.tours.length > 0 ? (
                    <select 
                      value={selectedTour} 
                      onChange={(e) => setSelectedTour(e.target.value)}
                      className="w-full bg-[#1c1c21] border border-[#F9704E] focus:border-[#F9704E] p-4 rounded-xl text-xs text-white focus:outline-none transition-all duration-200 font-sm"
                    >
                      {currentLider.tours.map((tour: any, idx: number) => {
                        const tourId = tour.id || tour._id || idx;
                        return (
                          <option key={tourId} value={tourId}>
                            {tour.title || tour.name} - تاریخ: {tour.date || 'تعیین نشده'} ({tour.price || '۰'} تومان)
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-center">
                      هنوز توری برای این لیدر ثبت نشده است.
                    </div>
                  )}
                </div>

                {/* گالری تصاویر تورِ انتخاب‌شده (طراحی مدرن، مرکزچین، زیبا با قابلیت زوم عالی) */}
                {currentTourDetails && currentTourDetails.images && currentTourDetails.images.length > 0 && (
                  <div className="mt-4 p-4 bg-neutral-900/60 border border-[#F9704E] rounded-2xl flex flex-col items-center">
                    <span className="block text-xs text-neutral-300 mb-3 font-semibold text-center">📷 گالری تصاویر تور (برای بزرگنمایی کلیک کنید):</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full justify-items-center">
                      {currentTourDetails.images.map((imgUrl: string, imgIdx: number) => (
                        <div 
                          key={imgIdx} 
                          onClick={() => setActiveImageModal(imgUrl)}
                          className="w-full aspect-square rounded-2xl overflow-hidden border border-[#F9704E] bg-neutral-950 cursor-pointer group relative shadow-lg hover:border-[#F9704E] transition-all duration-300"
                        >
                          <img
                            src={imgUrl}
                            alt={`تصویر ${imgIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                         <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-white text-xs bg-black/70 px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-md">🔍 بزرگنمایی</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                 {/* مودال بزرگنمایی تصویر گالری (باید داخل return باشد) */}
          {activeImageModal && (
            <div 
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
              onClick={() => setActiveImageModal(null)}
            >
              <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <img 
                  src={activeImageModal} 
                  alt="تصویر بزرگ شده" 
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-neutral-700 shadow-2xl"
                />
                <button 
                  type="button"
                  onClick={() => setActiveImageModal(null)}
                  className="absolute top-4 left-4 bg-neutral-800/80 hover:bg-neutral-700 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all shadow-lg border border-neutral-600 cursor-pointer"
                  title="بستن"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

                     {/* تعداد صندلی مورد نیاز */}
                <div className="mb-4">
                  <label className="block text-sm text-white mb-2 font-medium">تعداد صندلی مورد نیاز</label>
                  <div className="flex items-center justify-between bg-[#1c1c21] border border-[#F9704E] p-3 rounded-xl">
<button
  type="button"
  onClick={() => {
    const current = parseInt(seatsCount, 10) || 1;
    if (current > 1) setSeatsCount((current - 1).toString());
  }}
  className="w-10 h-10 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-900/40 hover:bg-rose-900/80 flex items-center justify-center text-lg font-bold transition-all active:scale-95 cursor-pointer"
>
  -
</button>

<span className="text-white font-bold text-sm">
  {seatsCount} صندلی
</span>
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(seatsCount, 10) || 1;
                        if (current < 10) setSeatsCount((current + 1).toString());
                      }}
                       className="w-10 h-10 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-900/40 hover:bg-rose-900/80 flex items-center justify-center text-lg font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* مجموع قیمت صندلی‌ها در مرحله اول */}
                {currentTourDetails && (
                  <div className="mb-4 p-4 rounded-xl bg-neutral-900/60 border border-[#F9704E] flex items-center justify-between">
                    <span className="text-xs text-neutral-400 font-medium">🧮 مجموع قیمت صندلی‌ها:</span>
                    <span className="text-xl font-extrabold text-[#F9704E] tracking-wide">
                      {calculateTotalPrice()}
                    </span>
                  </div>
                )}
              </div>
            )}

             {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm  text-white mb-2 font-medium">نام و نام خانوادگی نماینده مسافران</label>
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثال: رضا کیهانی" className="w-full bg-[#1c1c21]  border border-[#F9704E] focus:border-[#F9704E] p-4 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none transition-all duration-200 font-medium" />
                  </div>

                  <div>
                    <label className="block text-sm text-white mb-2 font-medium">شماره موبایل</label>
                    <input type="tel" required maxLength={11} value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="09191294068" className={`w-full bg-[#1c1c21] border p-4 rounded-xl text-xs text-left text-white placeholder-neutral-500 focus:outline-none transition-all duration-200 font-mono tracking-wider font-medium ${phone.length > 0 && !isPhoneValid ? ' border border-[#F9704E] focus:border-red-500' : ' border border-[#F9704E] focus:border-[#F9704E]'}`} style={{ direction: 'ltr' }} />
                  </div>

                  {isPhoneValid && (
                    <div className="space-y-5 animate-fadeIn">
                      <div>
                        <label className="block text-sm text-white mb-2 font-medium">کد ملی</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          required 
                          maxLength={10} 
                          value={nationalId} 
                          onChange={(e) => {
                            const val = e.target.value.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
                            setNationalId(val.replace(/[^0-9]/g, ''));
                          }} 
                          placeholder="0012345678" 
                          className={`w-full bg-[#1c1c21] border p-4 rounded-xl text-xs text-left text-white placeholder-neutral-500 focus:outline-none transition-all duration-200 font-mono tracking-wider font-medium ${nationalId.length > 0 && !isIdValid ? ' border border-[#F9704E] focus:border-red-500' : ' border border-[#F9704E] focus:border-[#F9704E]'}`} 
                          style={{ direction: 'ltr' }} 
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-white mb-2 font-medium">بارگذاری تصویر کارت ملی (اختیاری)</label>
                        <input type="file" ref={idCardInputRef} accept="image/*" onChange={handleIdCardChange} className="hidden" />
                        {idCardPreview ? (
                    <div className="relative w-full aspect-4/2 rounded-xl overflow-hidden border-2 border-[#F9704E] focus:border-[#F9704E] focus-within:border-[#F9704E] active:border-[#F9704E] focus:outline-none bg-neutral-900">
     
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40">
                              <button type="button" onClick={() => idCardInputRef.current?.click()} className="text-[11px] bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-neutral-200 transition-all cursor-pointer">تغییر عکس</button>
                              <button type="button" onClick={handleRemoveIdCard} className="text-[11px] bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-bold transition-all cursor-pointer">حذف عکس</button>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => idCardInputRef.current?.click()} className={`w-full border-2 border-dashed bg-[#1c1c21] p-5 rounded-xl text-xs text-center transition-all duration-200 font-medium flex flex-col items-center justify-center gap-2 cursor-pointer ${idCardError ? 'border-red-500/50 text-red-400' : 'border-[#F9704E] hover:border-[#F9704E]/50 text-neutral-400'}`}>
                            <span className="text-lg">🪪</span>
                            <span>برای آپلود عکس کارت ملی کلیک کنید</span>
                          </button>
                        )}
                        {idCardError && <p className="text-xs text-red-400 mt-2 font-medium">{idCardError}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div className="bg-[#1a1a1f] border border-[#F9704E] p-5 rounded-2xl space-y-4">
                    <div className="bg-[#121215] p-4 rounded-xl  border border-[#F9704E] flex flex-col gap-2">
                      <span className="text-[11px] text-neutral-400 font-medium">💰 مبلغ دقیق جهت واریز:</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-extrabold text-[#F9704E] tracking-tight block py-1">
                          {calculateTotalPrice()}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => {
                            let rawPrice = currentTourDetails ? p2e(currentTourDetails.price).replace(/[^0-9]/g, '') : "0";
                            const numericPrice = (parseInt(rawPrice, 10) * parseInt(seatsCount, 10)).toString();
                            navigator.clipboard.writeText(numericPrice);
                            alert("مبلغ عددی کپی شد!");
                          }} 
                          className="text-[10px] bg-neutral-800  border border-[#F9704E] text-neutral-300 px-2.5 py-1.5 rounded-md font-medium transition-colors active:scale-95"
                        >
                          کپی مبلغ عددی
                        </button>
                      </div>
                    </div>
<div className="border-t border-neutral-800/80 pt-3">
  <span className="block text-[11px] text-neutral-400 mb-1.5 font-medium">💳 شماره کارت‌های لیدر:</span>
  
  {currentLider.cards && currentLider.cards.length > 0 ? (
    <div className="space-y-2">
      {currentLider.cards.map((card: any, index: number) => (
        <div key={index} className="flex items-center justify-between bg-[#121215] p-3 rounded-xl border border-[#F9704E]">
          <div className="flex flex-col">
            <span className="text-xs text-orange-400 font-bold">
              {card.bankName ? `بانک ${card.bankName}` : `کارت شماره ${index + 1}`}
              {card.cardOwner ? ` - ${card.cardOwner}` : ''}
            </span>
            <span className="font-mono text-xs text-white tracking-wider mt-0.5" dir="ltr">
              {card.cardNumber}
            </span>
          </div>
          
          <button
            type="button"
            onClick={() => handleCopyCard(card.cardNumber)}
            className="text-[10px] bg-neutral-800  border border-[#F9704E] text-white px-2.5 py-1.5 rounded-md transition-colors font-medium active:scale-95"
          >
            {isCopied ? "کپی شد ✓" : "کپی کارت"}
          </button>
        </div>
      ))}
    </div>
  ) : (
    <div className="bg-[#121215] p-3 rounded-xl border border-[#F9704E] text-center">
      <span className="text-xs text-neutral-400">شماره کارتی ثبت نشده است</span>
    </div>
  )}
</div>
                  </div>

                  <div>
                    <label className="block text-sm text-white mb-2 font-medium">بارگذاری تصویر فیش واریزی</label>
                    <input type="file" ref={receiptInputRef} accept="image/*" onChange={handleReceiptChange} className="hidden" />
{receiptPreview ? (
<div className="relative w-full aspect-4/2 rounded-xl overflow-hidden border-2 border-[#F9704E] focus:border-[#F9704E] focus-within:border-[#F9704E] active:border-[#F9704E] focus:outline-none bg-neutral-900">
    <img src={receiptPreview} alt="فیش" className="w-full h-full object-cover opacity-80" />
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 gap-3">
      <button type="button" onClick={() => receiptInputRef.current?.click()} className="text-[11px] bg-white text-black px-4 py-2 rounded-lg font-medium">
         تغییر  فیش
      </button>
      {/* اصلاح دکمه حذف برای پاک کردن فیش واریزی */}
      <button type="button" onClick={handleRemoveReceipt} className="text-[11px] bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium">
       حذف فیش
      </button>
    </div>
  </div>
                    ) : (
                      <button type="button" onClick={() => receiptInputRef.current?.click()} className={`w-full border-2 border-dashed bg-[#1c1c21] p-5 rounded-xl text-xs text-center transition-all duration-200 font-medium flex flex-col items-center justify-center gap-2 cursor-pointer ${receiptError ? 'border-red-500/50 text-red-400' : ' border-[#F9704E] hover:border-[#F9704E]/50 text-neutral-400'}`}>
                        <span className="text-lg">📸</span>
                        <span>برای آپلود عکس فیش کلیک کنید</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

               <div className="space-y-3 pt-2">
                {!isStepValid() && getValidationHint() && (
                  <div className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl text-center">
                    {getValidationHint()}
                  </div>
                )}

                <div className="flex gap-3">
                  {step > 1 && (
                    <button type="button" onClick={prevStep} className="w-1/3 bg-amber-500/10 hover:bg-amber-500/10 text-white font-bold py-4 rounded-xl text-xs transition-all border border-[#F9704E] active:scale-95">
                      مرحله قبل
                    </button>
                  )}

                  {step < 3 ? (
                    <button 
                      type="button" 
                      disabled={!isStepValid()} 
                      onClick={nextStep} 
                      className="flex-1 text-white py-4 rounded-xl font-bold transition-all duration-200 text-xs active:scale-95 flex items-center justify-center disabled:cursor-not-allowed border" 
                      style={
                        isStepValid() 
                          ? { backgroundColor: activeColor, borderColor: activeColor } 
                          : { backgroundColor: 'rgba(249, 112, 78, 0.15)', borderColor: 'rgba(249, 112, 78, 0.3)', color: 'rgba(255, 255, 255, 0.4)' }
                      }
                    >
                      مرحله بعدی 
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !isStepValid()} 
                      className="flex-1 text-white py-4 rounded-xl font-bold transition-all duration-200 text-xs active:scale-[0.99] flex items-center justify-center gap-2 disabled:cursor-not-allowed border" 
                      style={
                        isStepValid() 
                          ? { backgroundColor: activeColor, borderColor: activeColor, boxShadow: `0 8px 24px ${activeColor}30` } 
                          : { backgroundColor: 'rgba(249, 112, 78, 0.15)', borderColor: 'rgba(249, 112, 78, 0.3)', color: 'rgba(255, 255, 255, 0.4)' }
                      }
                    >
                      {isSubmitting ? "در حال ارسال..." : "ثبت نهایی و ارسال مدارک"}
                    </button>
                  )}
                </div>
              </div>

          </form>
        )}
      </div>

    </div>
  </div>
);
} 

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white text-xs">بارگذاری...</div>}>
      <TourForm />
    </Suspense>
  );
}