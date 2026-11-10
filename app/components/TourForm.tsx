"use client";
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

interface TourFormProps {
  leader?: any;
}

export default function TourForm({ leader: initialLeader }: TourFormProps) {
  const [currentLider, setCurrentLider] = useState<any>(initialLeader || null);
  const [selectedTour, setSelectedTour] = useState<string>(
    initialLeader?.tours?.[0]?.id ?? ''
  );
  const [selectedHotel, setSelectedHotel] = useState<any>(null);

  const currentTourObj = (typeof selectedTour === 'object' && selectedTour !== null) 
    ? selectedTour 
    : ((currentLider?.tours || []).find((t: any) => t === selectedTour || t?.name === selectedTour || t?.title === selectedTour) || {});

  const matchedTour: any = currentTourObj || {};
  const tourServices: string[] = Array.isArray(matchedTour.services) ? matchedTour.services : [];
  const tourHotels: any[] = Array.isArray(matchedTour.hotels) ? matchedTour.hotels : [];

  const [isloadingLeader, setIsLoadingLeader] = useState(!initialLeader);
  const router = useRouter();
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [seatsCount, setSeatsCount] = useState('1');
  const [idCardImage, setIdCardImage] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [idCardError, setIdCardError] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'online'>('card');
  
  const isBirthDateValid = birthDate.trim().length >= 8; 
  const isNationalIdValid = nationalId.trim().length === 10;
  const isPhoneValid = /^09\d{9}$/.test(phone);
  const isIdValid = /^\d{10}$/.test(nationalId);

  const toPersianNumbers = (str: string | number) => {
    if (!str) return '';
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
  };

  const toEnglishDigits = (str: string) => {
    if (!str) return "";
    return str
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  };

  const handleRemoveIdCard = () => {
    setIdCardImage(null);
    if (idCardPreview) URL.revokeObjectURL(idCardPreview);
    setIdCardPreview(null);
    setIdCardError(null);
    if (idCardInputRef.current) idCardInputRef.current.value = '';
  };

  const handleRemoveReceipt = () => {
    setReceiptImage(null);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(null);
    setReceiptError(null);
    if (receiptInputRef.current) receiptInputRef.current.value = "";
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
    if (initialLeader) {
      setCurrentLider(initialLeader);
      setIsLoadingLeader(false);
      return;
    }

    if (!tenantSlug) {
      setIsLoadingLeader(false);
      return;
    }

    let isMounted = true;

    const fetchLeaderFromDb = async () => {
      try {
        const res = await fetch(`/api/leader-info?slug=${tenantSlug}`, {
          cache: 'no-store'
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
        if (isMounted) setIsLoadingLeader(false);
      }
    };

    fetchLeaderFromDb();

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, initialLeader]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');

      if (paymentStatus === 'success') {
        alert('🎉 پرداخت و ثبت‌نام شما با موفقیت انجام شد!.');
        window.history.replaceState({}, document.title, window.location.pathname + (window.location.search.includes('slug=') ? `?slug=${urlParams.get('slug') || ''}` : ''));
      } else if (paymentStatus === 'canceled') {
        alert('⚠️ فرآیند پرداخت توسط شما لغو شد.');
        window.history.replaceState({}, document.title, window.location.pathname + (window.location.search.includes('slug=') ? `?slug=${urlParams.get('slug') || ''}` : ''));
      } else if (paymentStatus === 'failed' || paymentStatus === 'error') {
        alert('❌ خطا در تراکنش یا تأیید پرداخت. لطفاً دوباره تلاش کنید.');
        window.history.replaceState({}, document.title, window.location.pathname + (window.location.search.includes('slug=') ? `?slug=${urlParams.get('slug') || ''}` : ''));
      }
    }
  }, []);

  const maxSize = 5 * 1024 * 1024;

  const handleIdCardChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdCardError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > maxSize) {
        setIdCardError("❌ حجم عکس کارت ملی بیش از ۵ مگابایت است.");
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          setIdCardImage(data.url);
          setIdCardPreview(URL.createObjectURL(file));
        } else {
          setIdCardError(data.message || 'خطا در آپلود عکس');
        }
      } catch (err) {
        console.error('Upload error:', err);
        setIdCardError('خطا در ارتباط با سرور برای آپلود');
      }
    }
  };

  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setReceiptError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > maxSize) {
        setReceiptError("❌ حجم عکس فیش بیش از ۵ مگابایت است.");
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          setReceiptImage(data.url);
          setReceiptPreview(URL.createObjectURL(file));
        } else {
          setReceiptError(data.message || 'خطا در آپلود عکس فیش');
        }
      } catch (err) {
        console.error('Upload error:', err);
        setReceiptError('خطا در ارتباط با سرور برای آپلود');
      }
    }
  };

  const isStepValid = () => {
    if (step === 1) return selectedTour !== '';
    if (step === 2) {
      return fullName.trim() !== '' && isPhoneValid && isIdValid && !idCardError && isBirthDateValid && isNationalIdValid && isTermsAccepted;
    }
    if (step === 3) return receiptImage !== null && !receiptError;
    return false;
  };

  const nextStep = () => {
    if (isStepValid() && step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const currentTourDetails = currentLider?.tours?.find(
    (t: any) => String(t.id) === String(selectedTour) || String(t._id) === String(selectedTour)
  );

  const calculateTotalPrice = () => {
    if (!currentTourDetails) return "۰ تومان";
    let englishDigits = p2e(currentTourDetails.price);
    const cleanPriceString = englishDigits.replace(/[^0-9]/g, '');
    const pricePerSeat = parseInt(cleanPriceString, 10);
    const seats = parseInt(seatsCount, 10);

    if (isNaN(pricePerSeat) || isNaN(seats)) return "۰ تومان";
    const total = pricePerSeat * seats;
    return total.toLocaleString('fa-IR') + " تومان";
  };

  // تعریف دقیق تابع پرداخت آنلاین
  const handleOnlinePayment = async () => {
    setIsSubmitting(true);
    let rawPrice = currentTourDetails?.price ? p2e(String(currentTourDetails.price)).replace(/[^0-9]/g, '') : '0';
    let finalSeats = seatsCount || '1';
    let amountInRial = (parseInt(rawPrice, 10) * parseInt(finalSeats, 10)) * 10;

    try {
      const res = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInRial: amountInRial,
          description: `رزرو تور ${currentTourDetails?.title || currentTourDetails?.name || ''}`,
          leaderId: currentLider?.id || currentLider?.slug || 'leader_1',
          fullName: fullName.trim(),
          mobile: phone.trim(),
          phone: phone.trim(),
          nationalId: nationalId.trim(),
          seatsCount: finalSeats,
          passengerData: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            mobile: phone.trim(),
            nationalId: nationalId.trim(),
            seatsCount: finalSeats,
            birthDate: birthDate,
          }
        }),
      });

      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || 'خطا در ایجاد درگاه پرداخت');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Payment request error:', err);
      alert('خطا در ارتباط با سرور پرداخت');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const tourTitle = currentTourDetails ? `${currentTourDetails.title || currentTourDetails.name} (${currentTourDetails.date || ''})` : 'تور عمومی';
    const rawPrice = currentTourDetails?.price ? parseInt(String(currentTourDetails.price).replace(/[^0-9]/g, ''), 10) || 0 : 0;
    const calculatedAmount = (rawPrice * parseInt(String(seatsCount || 1), 10)).toString();

    if (paymentMethod === "card") {
      try {
        const payload = {
          leaderId: currentLider?.id || currentLider?.slug,
          tourName: tourTitle,
          fullName: fullName.trim(),
          nationalId: nationalId.trim(),
          mobile: phone.trim(),
          seats: seatsCount,
          amount: calculatedAmount,
          paymentMethod: "card",
          receiptImage: receiptImage,
          paymentStatus: "در انتظار تایید فیش",
        };

        const res = await fetch('/api/passengers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok) {
          setIsSuccess(true);
        } else {
          alert('خطا در ثبت اطلاعات: ' + (data.error || 'لطفاً دوباره تلاش کنید'));
        }
      } catch (error) {
        console.error("Card payment save error:", error);
        alert('خطا در ارتباط با سرور');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
  };

  const handleReset = () => {
    setFullName('');
    setPhone('');
    setNationalId('');
    setSeatsCount('1');
    setStep(1);
    setBirthDate('');
    setPaymentMethod('card');
    setReceiptImage(null);
    setReceiptPreview(null);
    setIdCardImage(null);
    setIdCardPreview(null);
    setIdCardError(null);
    setReceiptError(null);
    setIsSuccess(false);
    if (currentLider && currentLider.tours?.length > 0) {
      setSelectedTour(currentLider.tours[0].id || currentLider.tours[0]._id);
    }
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
    return null;
  };

  if (!currentLider) {
    return (
      <div className="min-h-screen bg-[#121214] text-white flex flex-col items-center justify-center p-4 dir-rtl">
        <div className="text-center p-10 bg-neutral-900 border border-[#F9704E] rounded-2xl max-w-sm">
          <h2 className="text-base font-bold text-[#F9704E] mb-2">در حال بارگذاری اطلاعات تور لیدر ........</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9704E] text-white p-4 flex flex-col items-center justify-center" dir="rtl">
      <div className="w-full max-w-lg bg-[#121215] border-2 border-[#E5C060] rounded-[28px] p-5 sm:p-8 overflow-hidden shadow-2xl shadow-black/80 my-2">
        
        {/* هدر */}
        <div className="p-2.5 sm:p-4 border-2 border-[#E5C060] rounded-[20px] flex flex-row items-center justify-between bg-neutral-900/20 gap-2 sm:gap-4 w-full overflow-hidden">
          <div className="flex items-center justify-start shrink-0">
            <img src="/logo.png" alt="Lidera Logo" className="h-8 sm:h-10 w-auto object-contain" />
          </div>
          <div className="flex-1 text-center px-2">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight truncate">
              {currentLider.fullName || currentLider.name}
            </h1>
            <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 truncate">
              {currentLider.title || currentLider.brandName || 'تورلیدر رسمی'}
            </p>
          </div>
          <div className="flex items-center justify-end shrink-0">
            <a
              href={`/login${window.location.search}`}
              className="flex items-center justify-center px-1.5 sm:px-3 py-1 sm:py-1.5 bg-[#F9704E] text-white rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 text-[10px] sm:text-xs font-bold border border-[#F9704E] whitespace-nowrap"
            >
              ورود لیدر
            </a>
          </div>
        </div>

        {/* مراحل */}
        {!isSuccess && (
          <div className="px-2 pt-3 pb-2 flex items-center justify-center w-full max-w-sm mx-auto" dir="rtl">
            {[
              { n: 1, label: 'انتخاب تور' },
              { n: 2, label: 'مشخصات' },
              { n: 3, label: 'پرداخت' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.n}>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= s.n ? 'bg-[#F9704E] text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                    {s.n}
                  </span>
                  <span className={step >= s.n ? 'text-white' : 'text-neutral-500'}>
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div
                    className="mx-2 sm:mx-3"
                    style={{
                      flex: 1,
                      height: '3px',
                      minWidth: '12px',
                      borderRadius: '9999px',
                      background: step > s.n ? '#F9704E' : '#525252',
                      transition: 'background 300ms',
                    }}
                  />
                )}
              </React.Fragment>
            ))}
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
              <button onClick={handleReset} className="text-xs font-bold px-6 py-3 rounded-xl bg-[#F9704E] text-white border-b-2 border-[#F9704E] transition-all duration-200 mt-4 mx-auto block active:scale-95 cursor-pointer">
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
                        className="w-full bg-[#1c1c21] border border-[#F9704E] p-2.5 rounded-xl text-xs md:text-sm text-white focus:outline-none transition-all duration-200 cursor-pointer"
                      >
                        {currentLider.tours.map((tour: any, idx: number) => {
                          const tourId = tour.id || tour._id || idx;
                          return (
                            <option key={tourId} value={tourId}>
                              {toPersianNumbers(tour.name || tour.title || 'بدون عنوان')} | تاریخ: {toPersianNumbers(tour.date || 'تعیین نشده')} | {tour.price ? Number(tour.price).toLocaleString('fa-IR') : ''} تومان
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

                  {/* گالری تصاویر */}
                  {currentTourDetails && (() => {
                    const allImages = currentTourDetails?.images?.length > 0
                      ? currentTourDetails.images
                      : [
                          currentTourDetails?.image1,
                          currentTourDetails?.image2,
                          currentTourDetails?.image3,
                          currentTourDetails?.image4,
                          ...(currentTourDetails?.tourImages?.map((img: any) => img.url) || [])
                        ].filter(Boolean);

                    if (allImages.length === 0) return null;
                    return (
                      <div className="mt-4 p-4 bg-neutral-900/60 border border-[#F9704E] rounded-2xl flex flex-col items-center">
                        <span className="block text-xs text-neutral-300 mb-3 font-semibold text-center">
                          📷 (برای بزرگنمایی کلیک کنید) گالری تصاویر تور
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full justify-items-center">
                          {allImages.map((imgUrl: string, imgIdx: number) => (
                            <div
                              key={imgIdx}
                              onClick={() => setActiveImageModal(imgUrl)}
                              className="w-full aspect-square rounded-2xl overflow-hidden border border-[#F9704E] bg-neutral-950 cursor-pointer group relative shadow-lg hover:border-white transition-all"
                            >
                              <img
                                src={imgUrl}
                                alt={`تصویر ${imgIdx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* مودال بزرگنمایی */}
                  {activeImageModal && (
                    <div 
                      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                      onClick={() => setActiveImageModal(null)}
                    >
                      <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <img src={activeImageModal} alt="بزرگنمایی" className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-neutral-700 shadow-2xl" />
                        <button type="button" onClick={() => setActiveImageModal(null)} className="absolute top-4 left-4 bg-neutral-800 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer">✕</button>
                      </div>
                    </div>
                  )}

                  {/* حمل و نقل، خدمات و هتل‌ها */}
                  {currentTourObj && Object.keys(currentTourObj).length > 0 && (
                    <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3 mt-4 text-right" dir="rtl">
                      <div className="flex items-center justify-between text-xs text-zinc-300 border-b border-white/10 pb-2">
                        <span>نوع سفر / حمل‌ونقل: <strong className="text-[#F9704E]">{matchedTour.transportType || matchedTour.transport || 'قطار ۴ تخته'}</strong></span>
                      </div>

                      {tourServices.length > 0 && (
                        <div>
                          <span className="text-xs text-zinc-400 block mb-1.5">خدمات این تور:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {tourServices.map((srv: string, idx: number) => (
                              <span key={idx} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[11px]">
                                ✓ {srv}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {tourHotels.length > 0 && (
                        <div className="border-t border-white/10 pt-3">
                          <label className="text-xs text-zinc-400 block mb-2">انتخاب هتل و نرخ‌نامه:</label>
                          <div className="space-y-2">
                            {tourHotels.map((hotel: any, idx: number) => (
                              <label key={idx} className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${selectedHotel?.name === hotel.name ? 'border-[#F9704E] bg-[#F9704E]/10' : 'border-white/10 bg-black/20 hover:bg-black/40'}`}>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="radio" 
                                    name="tourHotel" 
                                    checked={selectedHotel?.name === hotel.name}
                                    onChange={() => setSelectedHotel(hotel)}
                                    className="accent-[#F9704E]"
                                  />
                                  <div>
                                    <span className="text-xs font-bold text-white block">{hotel.name || hotel.hotelName}</span>
                                    <span className="text-[10px] text-zinc-400">{hotel.desc || hotel.description || ''}</span>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-[#F9704E]">{Number(hotel.price || 0).toLocaleString()} تومان</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* تعداد صندلی */}
                  <div className="mb-4">
                    <label className="block text-sm text-white mb-2 font-medium">تعداد صندلی مورد نیاز</label>
                    <div className="flex items-center justify-between bg-[#1c1c21] border border-[#F9704E] p-3 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseInt(seatsCount, 10) || 1;
                          if (current > 1) setSeatsCount((current - 1).toString());
                        }}
                        className="w-10 h-10 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-900/40 hover:bg-rose-900/80 flex items-center justify-center text-lg font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-white font-bold text-sm">{seatsCount} تعداد نفر/ صندلی</span>
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseInt(seatsCount, 10) || 1;
                          if (current < 10) setSeatsCount((current + 1).toString());
                        }}
                        className="w-10 h-10 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-900/40 hover:bg-rose-900/80 flex items-center justify-center text-lg font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* مجموع قیمت */}
                  {currentTourDetails && (
                    <div className="mb-4 p-4 rounded-xl bg-neutral-900/60 border border-[#F9704E] flex items-center justify-between">
                      <span className="text-xs text-neutral-400">مجموع قابل پرداخت:</span>
                      <span className="text-sm font-bold text-[#F9704E]">{calculateTotalPrice()}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full py-3 bg-[#F9704E] text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer"
                  >
                    مرحله بعد (مشخصات مسافر)
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-white mb-1.5 font-medium">نام و نام خانوادگی کامل</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثال: علی رضایی"
                      className="w-full bg-[#1c1c21] border border-neutral-700 focus:border-[#F9704E] p-3 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white mb-1.5 font-medium">شماره موبایل</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(toEnglishDigits(e.target.value))}
                      placeholder="09123456789"
                      maxLength={11}
                      className="w-full bg-[#1c1c21] border border-neutral-700 focus:border-[#F9704E] p-3 rounded-xl text-xs text-white focus:outline-none text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white mb-1.5 font-medium">کد ملی (۱۰ رقم)</label>
                    <input 
                      type="text" 
                      value={nationalId}
                      onChange={(e) => setNationalId(toEnglishDigits(e.target.value))}
                      placeholder="0012345678"
                      maxLength={10}
                      className="w-full bg-[#1c1c21] border border-neutral-700 focus:border-[#F9704E] p-3 rounded-xl text-xs text-white focus:outline-none text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white mb-1.5 font-medium">تاریخ تولد (مثال: ۱۳۷۰/۰۱/۰۱)</label>
                    <input 
                      type="text" 
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      placeholder="1370/01/01"
                      className="w-full bg-[#1c1c21] border border-neutral-700 focus:border-[#F9704E] p-3 rounded-xl text-xs text-white focus:outline-none text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white mb-1.5 font-medium">تصویر کارت ملی</label>
                    <input 
                      type="file" 
                      ref={idCardInputRef}
                      onChange={handleIdCardChange}
                      accept="image/*"
                      className="w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#F9704E] file:text-white cursor-pointer"
                    />
                    {idCardPreview && (
                      <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-neutral-700">
                        <img src={idCardPreview} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                        <button type="button" onClick={handleRemoveIdCard} className="absolute top-1 left-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center">✕</button>
                      </div>
                    )}
                    {idCardError && <p className="text-[10px] text-red-400 mt-1">{idCardError}</p>}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      checked={isTermsAccepted} 
                      onChange={(e) => setIsTermsAccepted(e.target.checked)}
                      className="w-4 h-4 accent-[#F9704E] rounded cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-xs text-neutral-300 cursor-pointer">
                      قوانین و مقررات تور را مطالعه کرده و می‌پذیرم.
                    </label>
                  </div>

                  {getValidationHint() && (
                    <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 text-center">
                      {getValidationHint()}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={prevStep} className="w-1/3 py-3 bg-neutral-800 text-white rounded-xl font-bold text-xs hover:bg-neutral-700 cursor-pointer">
                      مرحله قبل
                    </button>
                    <button 
                      type="button" 
                      onClick={nextStep} 
                      disabled={!isStepValid()}
                      className={`w-2/3 py-3 rounded-xl font-bold text-xs transition-all ${isStepValid() ? 'bg-[#F9704E] text-white cursor-pointer active:scale-95' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`}
                    >
                      مرحله بعد (پرداخت)
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${paymentMethod === 'card' ? 'bg-[#F9704E] border-[#F9704E] text-white' : 'bg-neutral-900 border-neutral-700 text-neutral-400'}`}
                    >
                      کارت به کارت (آپلود فیش)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${paymentMethod === 'online' ? 'bg-[#F9704E] border-[#F9704E] text-white' : 'bg-neutral-900 border-neutral-700 text-neutral-400'}`}
                    >
                      پرداخت آنلاین (درگاه)
                    </button>
                  </div>

                  {paymentMethod === 'card' ? (
                    <div className="space-y-4">
                      {currentLider?.cardInfo ? (
                        <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-700 text-center space-y-2">
                          <p className="text-xs text-neutral-400">شماره کارت مقصد:</p>
                          <p className="text-sm font-mono font-bold text-[#F9704E]" dir="ltr">{currentLider.cardInfo}</p>
                          <p className="text-xs text-neutral-300">به نام: {currentLider.cardOwner || currentLider.fullName}</p>
                        </div>
                      ) : (
                        <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-700 text-center">
                          <p className="text-xs text-neutral-400">شماره کارتی ثبت نشده است.</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs text-white mb-1.5 font-medium">تصویر فیش واریزی</label>
                        <input 
                          type="file" 
                          ref={receiptInputRef}
                          onChange={handleReceiptChange}
                          accept="image/*"
                          className="w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#F9704E] file:text-white cursor-pointer"
                        />
                        {receiptPreview && (
                          <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-neutral-700">
                            <img src={receiptPreview} alt="فیش" className="w-full h-full object-cover" />
                            <button type="button" onClick={handleRemoveReceipt} className="absolute top-1 left-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center">✕</button>
                          </div>
                        )}
                        {receiptError && <p className="text-[10px] text-red-400 mt-1">{receiptError}</p>}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button type="button" onClick={prevStep} className="w-1/3 py-3 bg-neutral-800 text-white rounded-xl font-bold text-xs hover:bg-neutral-700 cursor-pointer">
                          مرحله قبل
                        </button>
                        <button 
                          type="submit" 
                          disabled={isSubmitting || !receiptImage}
                          className={`w-2/3 py-3 rounded-xl font-bold text-xs transition-all ${!isSubmitting && receiptImage ? 'bg-emerald-600 text-white cursor-pointer active:scale-95' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`}
                        >
                          {isSubmitting ? 'در حال ثبت...' : 'ثبت نهایی و ارسال فیش'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-700 space-y-2">
                        <p className="text-xs text-neutral-300">با کلیک روی دکمه زیر به درگاه امن بانکی منتقل خواهید شد.</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button type="button" onClick={prevStep} className="w-1/3 py-3 bg-neutral-800 text-white rounded-xl font-bold text-xs hover:bg-neutral-700 cursor-pointer">
                          مرحله قبل
                        </button>
                        <button 
                          type="button"
                          onClick={handleOnlinePayment}
                          disabled={isSubmitting}
                          className="w-2/3 py-3 bg-[#F9704E] text-white rounded-xl font-bold text-xs shadow-lg hover:opacity-90 transition-all active:scale-95 cursor-pointer"
                        >
                          {isSubmitting ? 'در حال انتقال...' : 'اتصال به درگاه پرداخت'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </form>
          )}
        </div>
      </div>
    </div>
  );
}