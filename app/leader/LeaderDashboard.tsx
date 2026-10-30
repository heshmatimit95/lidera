"use client";
import { savePassengerPayment } from "@/app/actions/leader-actions"; // یا مسیری که فایل اکشن‌های لیدر قرار دارد
import { generateTourAiItinerary } from "../actions/ai-actions";
import { FaWhatsapp, FaTelegramPlane, FaInstagram, FaCopy, } from 'react-icons/fa';
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FaFileExcel, FaTrash, FaUserPlus, FaEdit, FaCheck, FaTimes, 
  FaMapMarkedAlt, FaPlus, FaKey, FaSignOutAlt, FaSearch, FaFilter,
  FaImage, FaCreditCard,FaUpload,FaMagic,FaShieldAlt
} from 'react-icons/fa';

interface Passenger {
  id: string;
  fullName: string;
 mobile: string;
  nationalId: string;
  tourName: string;
  paymentStatus: string;
  originalPaymentStatus?: string;
  insurance: boolean;
  tourDate?: string;
  receiptDate?: string;
  amount?: string;
  receiptImage?: string;
  startDate?: string;
  endDate?: string;
  seatsCount?: number | string;
  seats?: number | string;
  createdAt?: string;
}


interface TourItem {
  id?: string;
  name: string;
  images: string[];
  price?: string | number;
  date?: string;
}

interface BankCard {
  id: string;
  cardNumber: string;
  bankName: string;
  cardHolder: string;
}
export default function LeaderDashboard({ initialLeader, initialPassengers }: { initialLeader: any; initialPassengers: any }) {
const [leaderName, setLeaderName] = useState<string>(initialLeader?.name || '');
  const [passengers, setPassengers] = useState(initialPassengers || []);
  const [cards, setCards] = useState(initialLeader?.cards || []);
  const [activeTours, setActiveTours] = useState(initialLeader?.tours || []);
const [loadingMessage, setLoadingMessage] = useState('در حال ارتباط با هوش مصنوعی...');
const [currentTenantsSlug, setCurrentTenantsSlug] = useState(initialLeader?.slug || '');
const [aiTab, setAiTab] = useState<"dayByDay" | "packingList" | "promoText">("dayByDay");
const [customPrompt, setCustomPrompt] = useState("");
const [selectedTourName, setSelectedTourName] = useState("");
  const [loadingAiId, setLoadingAiId] = useState<string | null>(null);
 const [isAiModalOpen, setIsAiModalOpen] = useState(false);
const [aiData, setAiData] = useState<{ dayByDay: string; packingList: string; promoText: string } | null>(null);
const [activeTab, setActiveTab] = useState<'program' | 'packing' | 'promo'>('program');
const [copied, setCopied] = useState(false);
const [waiverFilter, setWaiverFilter] = useState('all');
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTenantSlug, setCurrentTenantSlug] = useState<string>('');
 const [selectedReceiptPassenger, setSelectedReceiptPassenger] = useState<any>(null);
const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
const [rejectReason, setRejectReason] = useState('');
const [showRejectInput, setShowRejectInput] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
// --- استیت‌های تنظیمات مالی و بانکی لیدر ---
const [paymentMethod, setPaymentMethod] = useState<'card' | 'gateway' | 'both'>(
    initialLeader?.paymentMethod || 'card'
  );
  const [leaderCards, setLeaderCards] = useState<BankCard[]>(
    initialLeader?.cards && initialLeader.cards.length > 0
      ? initialLeader.cards
      : [{ id: '1', cardNumber: '', bankName: '', cardHolder: '' }]
  );

   // --- استیت‌های تغییر رمز ---
  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState<boolean>(false);
  const [oldPasswordInput, setOldPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');

  // --- استیت مشاهده بزرگ تصویر فیش ---
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // --- استیت‌های جستجو و فیلتر ---
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;


  // --- استیت‌های مودال‌های مسافر (افزودن و ویرایش) با تایپ صریح عدد برای seats ---
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);

const [addFormData, setAddFormData] = useState<any>({
  fullName: '',
  phone: '',
  nationalId: '',
  birthDate: '',
  tourName: '',
  paymentStatus: 'در انتظار پرداخت',
  insurance: false,
  receiptDate: '',
  amount: '',
  receiptImage: '',
  seats: 1,
});

const [editFormData, setEditFormData] = useState<any>({
  fullName: '',
  phone: '',
  nationalId: '',
  birthDate: '',
  tourName: '',
  paymentStatus: 'در انتظار پرداخت',
  insurance: false,
  receiptDate: '',
  amount: '',
  receiptImage: '',
  seats: 1,
});
  // --- استیت‌های مودال تورها ---
  const [isTourModalOpen, setIsTourModalOpen] = useState<boolean>(false);
const [tourPlanData, setTourPlanData] = useState<string>(''); // مخصوص تب اول (برنامه سفر)
const [consultData, setConsultData] = useState<string>('');     // مخصوص تب دوم (مشاوره و چت آزاد)
const [promoData, setPromoData] = useState<string>('');         // مخصوص تب سوم (کپشن اینستاگرام)
  const [newTourName, setNewTourName] = useState<string>('');
  const [editingTourIndex, setEditingTourIndex] = useState<number | null>(null);
  const [editingTourNameValue, setEditingTourNameValue] = useState<string>('');
  const [newTourDate, setNewTourDate] = useState('');
  const [newTourPrice, setNewTourPrice] = useState('');
  const [editingTourDateValue, setEditingTourDateValue] = useState('');
  const [editingTourPriceValue, setEditingTourPriceValue] = useState('');

  
useEffect(() => {
  const s = new URLSearchParams(window.location.search).get('slug');
  router.prefetch(s ? `/?slug=${s}` : '/');
}, [router]);


const getShareText = () => {
  return aiTab === 'dayByDay' ? (tourPlanData || '')
    : aiTab === 'packingList' ? (consultData || '')
    : (promoData || '');
};


  // دریافت اطلاعات لیدر از دیتابیس
// دریافت اطلاعات لیدر از دیتابیس
  useEffect(() => {
    if (initialLeader) return; // اگر اطلاعات از سرور آمده، درخواست اضافی نزن

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const slugFromCookie = getCookie('leader_slug') || new URLSearchParams(window.location.search).get('slug');

    if (!slugFromCookie) {
      router.push('/login-leader');
      return;
    }

    setCurrentTenantsSlug(slugFromCookie);
    fetchLeaderData(slugFromCookie);
  }, [router]);
  

  const fetchLeaderData = async (slug: string) => {
    try {
      const res = await fetch(`/api/leader-info?slug=${slug}`);
      const data = await res.json();

      if (data.success && data.leader) {
        const l = data.leader;
        setLeaderName(data.leader.fullName || data.leader.name || '');
        setPaymentMethod(l.paymentMethod || 'card');
        setLeaderCards(l.cards || l.leaderCards || [{ id: '1', cardNumber: '', bankName: '', cardHolder: '' }]);
        setActiveTours(l.tours || []);
        
        const mappedPassengers = (l.passengers || []).map((p: any) => ({
          ...p,
          originalPaymentStatus: p.paymentStatus
        }));
        setPassengers(mappedPassengers);
        setIsAuthorized(true);
      } else {
        router.push('/login-leader');
      }
    } catch (error) {
      console.error('خطا در ارتباط با سرور:', error);
    } finally {
      setIsLoading(false);
    }
  };

 const handleSaveFinancialSettings = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tenantSlug = urlParams.get('slug') || currentTenantSlug;

    if (!tenantSlug) {
      alert('⚠️ اسلاگ لیدر در آدرس صفحه یافته نشد!');
      return;
    }

    try {
    const res = await fetch('/api/leaders/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: tenantSlug,
        slug: tenantSlug,
        paymentMethod,
        cards: leaderCards,
        leaderCards: leaderCards,
      }),
    });
      if (res.ok) {
        alert('✅ تنظیمات مالی و شماره کارت‌ها با موفقیت ذخیره شد!');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`❌ خطا در ذخیره تنظیمات: ${errData.message || 'خطای سرور'}`);
      }
    } catch (e) {
      console.error(e);
      alert('❌ خطای ارتباط با سرور.');
    }
  };

  const handleAddCard = () => {
    if (leaderCards.length >= 4) {
      alert('⚠️ حداکثر ۴ شماره کارت می‌توانید ثبت کنید!');
      return;
    }
    setLeaderCards([...leaderCards, { id: Date.now().toString(), cardNumber: '', bankName: '', cardHolder: '' }]);
  };

  const handleCardChange = (index: number, field: keyof BankCard, value: string) => {
    const updated = [...leaderCards];
    updated[index] = { ...updated[index], [field]: value };
    setLeaderCards(updated);
  };

  const handleDeleteCard = (index: number) => {
    if (leaderCards.length === 1) {
      alert('⚠️ حداقل وجود یک کارت بانکی الزامی است!');
      return;
    }
    const updated = leaderCards.filter((_, i) => i !== index);
    setLeaderCards(updated);
  };



  const handleLogout = () => {
    if (!confirm('آیا می‌خواهید از حساب کاربری خارج شوید؟')) return;
    
    setIsLoggingOut(true); // فعال کردن حالت لودینگ برای جلوگیری از حس هنگ

    const currentSlug = new URLSearchParams(window.location.search).get('slug') || '';
    
    // پاک کردن کوکی‌ها
    document.cookie = "leader_token=; path=/; max-age=0;";
    document.cookie = "leader_slug=; path=/; max-age=0;";

    // انتقال آنی با replace برای جلوگیری از بازگشت با دکمه Back مرورگر
    const targetUrl = currentSlug ? `/?slug=${currentSlug}` : '/';
    router.replace(targetUrl);
  };



const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchTerm(e.target.value);
  setCurrentPage(1); // اختیاری: بازگشت به صفحه اول هنگام جستجو
};


const handleChangePassword = async (e: React.FormEvent) => {
  e.preventDefault();
  if (newPasswordInput.trim().length < 4) {
    alert('⚠️ رمز عبور جدید باید حداقل ۴ کاراکتر باشد');
    return;
  }
  if (newPasswordInput !== confirmPasswordInput) {
    alert('❌ رمز عبور جدید با تکرار آن همخوانی ندارد');
    return;
  }

  try {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const tenantKey = searchParams ? (searchParams.get('slug') || searchParams.get('leaderId') || '') : '';

const res = await fetch('/api/admin/reset-leader-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    leaderId: tenantKey,
    newPassword: newPasswordInput // ارسال رمز جدید به سرور
  })
});

    if (res.ok) {
      const data = await res.json();
      alert(`🔑 ${data.message || 'رمز عبور با موفقیت تغییر کرد'}`);
      setIsChangePassModalOpen(false);
      setOldPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } else {
      const data = await res.json().catch(() => ({}));
      alert(`❌ تغییر رمز ناموفق بود: ${data.message || 'خطای سرور'}`);
    }
  } catch (e) {
    console.error(e);
    alert('❌ خطا در ارتباط با سرور برای تغییر رمز.');
  }
};


  // تابع تغییر وضعیت به صورت تکی در جدول
  const handleInlineStatusChange = (id: string, newStatus: string) => {
    setPassengers((prev: any) => prev.map((p: any) => p.id === id ? { ...p, paymentStatus: newStatus } : p));
  };

  const handleSaveSingleStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/passengers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, paymentStatus: newStatus })
      });
      if (res.ok) {
        setPassengers((prev: any) => prev.map((p: any) => p.id === id ? { ...p, originalPaymentStatus: newStatus, paymentStatus: newStatus } : p));
        alert('✅ وضعیت پرداخت بروزرسانی شد.');
      } else {
        alert('❌ خطا در بروزرسانی وضعیت.');
      }
    } catch (e) {
      console.error(e);
      alert('❌ خطای ارتباط با سرور.');
    }
  };

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        if (isEdit) {
          setEditFormData((prev: any) => ({ ...prev, receiptImage: result }));
        } else {
          setAddFormData((prev: any) => ({ ...prev, receiptImage: result }));
        }
      }
    };
    reader.readAsDataURL(file);
  }
};


  const filteredPassengers = useMemo(() => {
    return passengers.filter((p: Passenger) => {
      const matchSearch = 
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nationalId?.includes(searchTerm) ||
        p.mobile?.includes(searchTerm) ||
        p.tourName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' ? true : p.paymentStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [passengers, searchTerm, statusFilter]);

  const paginatedPassengers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPassengers.slice(start, start + itemsPerPage);
  }, [filteredPassengers, currentPage, itemsPerPage]);

  const handleDeleteAllRecords = async () => {
    if (passengers.length === 0) {
      alert('⚠ رکوردی وجود ندارد!');
      return;
    }
    if (confirm('🚨 آیا مطمئن هستید که می‌خواهید تمام رکوردهای مسافران را پاک کنید؟')) {
      try {
        const res = await fetch(`/api/passengers?tenantId=${currentTenantSlug}&all=true`, { method: 'DELETE' });
        if (res.ok) {
          setPassengers([]);
          alert('🗑️ تمام رکوردها پاک شدند.');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };


const handleTourImageUpload = (tourIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('⚠️ حجم تصویر نباید بیشتر از ۵ مگابایت باشد!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        const updated = [...activeTours];
        if (updated[tourIndex].images.length >= 4) {
          alert('⚠️ برای هر تور حداکثر می‌توانید ۴ عکس ثبت کنید!');
          return;
        }
        updated[tourIndex].images.push(result);
        setActiveTours(updated);
        await syncTourToDb(updated[tourIndex]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteTourImage = async (tourIndex: number, imgIndex: number) => {
    const updated = [...activeTours];
    updated[tourIndex].images.splice(imgIndex, 1);
    setActiveTours(updated);
    await syncTourToDb(updated[tourIndex]);
  };

  const syncTourToDb = async (tour: TourItem) => {
    if (!tour.id) return;
    try {
      await fetch('/api/tours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tour.id, name: tour.name, images: tour.images })
      });
    } catch (e) {
      console.error('خطا در بروزرسانی تصاویر تور در دیتابیس:', e);
    }
  };

// تابع محاسبه و بروزرسانی مبلغ برای فرم "افزودن"
  const calculateAddAmount = (selectedTourName: string, seatCount: number) => {
    const foundTour = activeTours.find((t: any) => t.name === selectedTourName);
    const unitPrice = foundTour ? Number(foundTour.price) || 0 : 0;
    const total = unitPrice * seatCount;

    setAddFormData((prev: any) => ({
      ...prev,
      tourName: selectedTourName,
      seats: seatCount,
      amount: total > 0 ? total.toString() : prev.amount,
    }));
  };
  // تابع محاسبه و بروزرسانی مبلغ برای فرم "ویرایش" (دیتای ثبت‌نامی قبلی را اصلاح می‌کند)
const calculateEditAmount = (selectedTourName: string, seatCount: number) => {
    // جستجوی تور در لیست تورهای لیدر
    const foundTour = activeTours.find((t: any) => 
      t.name === selectedTourName || 
      selectedTourName?.includes(t.name) || 
      t.name?.includes(selectedTourName)
    );
    
    // اگر قیمت پیدا شد، ضربدر تعداد صندلی کن
    const unitPrice = foundTour ? Number(String(foundTour.price).replace(/[^0-9]/g, '')) || 0 : 0;
    const total = unitPrice * seatCount;

setEditFormData((prev: any) => ({
      ...prev,
      tourName: selectedTourName,
      seats: seatCount,
      amount: total.toString(), // <--- همیشه مبلغ جدید را به صورت مستقیم ست کن
    }));
  };;
  const openAddModal = () => {
    const defaultTourName = activeTours[0]?.name || '';
    const defaultTourPrice = activeTours[0]?.price ? Number(activeTours[0].price) : 0;
    setAddFormData({
      fullName: '',
      phone: '',
      nationalId: '',
      tourName: defaultTourName,
      paymentStatus: 'در انتظار پرداخت',
      insurance: false,
      receiptDate: '',
      amount: defaultTourPrice > 0 ? defaultTourPrice.toString() : '',
      receiptImage: '',
      seats: 1,
    });
    setIsAddModalOpen(true);
  };

const openEditModal = (passenger: Passenger) => {
    const p = passenger as any; 
    
    // پیدا کردن نام تور مسافر به صورت انعطاف‌پذیر
    const rawTourName = p.tourName || p.tourTitle || '';
    const matchedTour = activeTours.find((t: any) => 
      t.name === rawTourName || 
      rawTourName.includes(t.name) || 
      t.name.includes(rawTourName)
    );
    const initialTour = matchedTour ? matchedTour.name : (activeTours[0]?.name || '');
    
    const initialSeats = Number(p.seatsCount || p.seats) || 1;
    
setEditId(p.id);
    setEditFormData({
      fullName: p.fullName || '',
       phone: p.phone || p.mobile || '',
      nationalId: p.nationalId || p.national_id || p.nationalCode || p.national_code || '',
      tourName: initialTour,
      paymentStatus: p.paymentStatus || 'در انتظار پرداخت',
      insurance: Boolean(p.insurance),
      receiptDate: p.receiptDate || '',
      amount: p.amount ? String(p.amount) : '0',
      receiptImage: p.receiptImage || '',
      seats: initialSeats,
    });
    
    // محاسبه اولیه مبلغ با توجه به تور پیدا شده و صندلی مسافر
    calculateEditAmount(initialTour, initialSeats);
    
    setIsEditModalOpen(true);
  };
 
  // ذخیره اطلاعات مسافر بدون بستن خودکار مودال (طبق درخواست)
  const handleSaveNewPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slugValue = currentTenantSlug || new URLSearchParams(window.location.search).get('slug') || '';
      const payload = { 
        tenantId: slugValue, 
        slug: slugValue, 
        ...addFormData, 
        seatsCount: addFormData.seats 
      };

      const res = await fetch('/api/passengers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();

      if (res.ok) {
        setPassengers((prev: any) => [{ ...responseData, originalPaymentStatus: responseData.paymentStatus }, ...prev]);
        alert('✅ مسافر جدید با موفقیت افزوده شد.');
        
      } else {
        alert('❌ خطا در ثبت اطلاعات: ' + (responseData.error || 'خطای سرور'));
      }
    } catch (e: any) {
      console.error(e);
      alert('❌ خطای ارتباط با سرور.');
    }
  };

const handleUpdatePassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    try {
      // پیدا کردن قیمت تور انتخاب شده از لیست تورهای فعال
const foundTour = activeTours.find((t: any) => 
      t.name === editFormData.tourName || editFormData.tourName?.includes(t.name) || t.name?.includes(editFormData.tourName)
    );
    const unitPrice = foundTour ? Number(String(foundTour.price || 0).replace(/[^0-9]/g, '')) || 0 : 0;
    const seatCount = Number(editFormData.seats || 1);
    const calculatedFinalAmount = unitPrice > 0 ? (unitPrice * seatCount).toString() : (editFormData.amount || '0');
     const response = await fetch(`/api/passengers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editId,
        tourName: editFormData.tourName,
        seats: Number(editFormData.seats || seatCount || 1), // <--- اصلاح دقیق تعداد صندلی
        amount: String(calculatedFinalAmount !== '0' ? calculatedFinalAmount : (editFormData.amount || '4100000')),
        paymentStatus: editFormData.paymentStatus,
        receiptDate: editFormData.receiptDate,
        insurance: editFormData.insurance,
        fullName: editFormData.fullName,
        mobile: editFormData.mobile,
        nationalId: editFormData.nationalId,
      }),
    });
      const responseData = await response.json();
if (response.ok) {
        // استفاده از داده‌های واقعی و جدیدی که سرور برگردانده است
        setPassengers((prev: any[]) =>
          prev.map((p: any) => (p.id === editId ? responseData : p))
        );
        setIsEditModalOpen(false);
        alert('ویرایش مسافر با موفقیت انجام شد ✅');
      }
       else {
        alert('خطا در بروزرسانی ❌: ' + (responseData.error || 'خطای سرور'));
      }
    } catch (error) {
      console.error(error);
      alert('خطای ارتباط با سرور ❌');
    }
  };

  const handleDeletePassenger = async (id: string) => {
    if (confirm('آیا از حذف این مسافر اطمینان دارید؟')) {
      try {
        const res = await fetch(`/api/passengers?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          setPassengers((prev: any) => prev.filter((p: any) => p.id !== id));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

const handleAddTour = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTourName.trim();
    if (!trimmed) return;

    if (activeTours.some((t: any) => t.name === trimmed)) {
      alert('⚠️ این تور از قبل وجود دارد');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const currentSlug = urlParams.get('slug');

    try {
      const res = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenantId: currentSlug, 
          name: trimmed, 
          date: newTourDate,    
          price: newTourPrice,   
          images: [] 
        })
      });
      if (res.ok) {
        const newTour = await res.json();
        setActiveTours((prev: any) => [...prev, newTour]);
        setNewTourName('');
        setNewTourDate('');    
        setNewTourPrice('');   
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTour = async (tourId?: string, tourName?: string) => {
    if (!tourId) return;
    if (confirm(`آیا تور "${tourName}" از دیتابیس حذف شود؟`)) {
      try {
        const res = await fetch(`/api/tours?id=${tourId}`, { method: 'DELETE' });
        if (res.ok) {
          setActiveTours((prev: any) => prev.filter((t: any) => t.id !== tourId));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleStartEditTour = (tourIdx: number, name: string, date: string, price: string) => {
    setEditingTourIndex(tourIdx);
    setEditingTourNameValue(name || '');
    setEditingTourDateValue(date || '');
    setEditingTourPriceValue(price || '');
  };                                   
                                   
  const handleSaveEditTour = async (tourId?: string, index?: number) => {
    if (!tourId || index === undefined) return;
    const trimmed = editingTourNameValue.trim();
    if (!trimmed) return;

    try {
      const res = await fetch('/api/tours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tourId, name: trimmed, date: editingTourDateValue, price: editingTourPriceValue })
      });
      if (res.ok) {
        const updatedTours = [...activeTours];
        updatedTours[index].name = trimmed;
        updatedTours[index].price = editingTourPriceValue;
        setActiveTours(updatedTours);
        setEditingTourIndex(null);
        setEditingTourNameValue('');
      }
    } catch (e) {
      console.error(e);
    }
  };


// تابع تایید فیش
  const handleApproveReceipt = async (passengerId: string) => {
    try {
      const formData = new FormData();
      formData.append("passengerId", passengerId);
      formData.append("paymentStatus", "پرداخت شده");
      
      // ارسال تاریخ دستی وارد شده توسط لیدر
      formData.append("receiptDate", selectedReceiptPassenger?.receiptDate || "");
      
      // محاسبه و ارسال مبلغ تور
// اول چک کن ببین مسافر از قبل مبلغی دارد یا نه؛ اگر داشت همان را حفظ کن، وگرنه محاسبه خودکار کن
    const existingAmount = selectedReceiptPassenger?.amount;
    const finalAmountToSend = existingAmount && existingAmount !== '0' && existingAmount !== 'NaN' 
      ? existingAmount 
      : (() => {
          const tourPriceRaw = selectedReceiptPassenger?.tourPrice || selectedReceiptPassenger?.price || selectedReceiptPassenger?.tour?.price || 17890000;
          const rawPrice = parseInt(String(tourPriceRaw).replace(/[^0-9]/g, ''), 10) || 17890000;
          const seats = parseInt(String(selectedReceiptPassenger?.seatsCount || selectedReceiptPassenger?.seats || 1), 10);
          return (rawPrice * seats).toString();
        })();

    formData.append("amount", finalAmountToSend);
      // فراخوانی اکشن سرور برای ذخیره اطلاعات
      const res = await savePassengerPayment(formData, window.location.pathname);

      if (res.success) {
        // فراخوانی ارسال پیامک تایید
        sendSmsNotification(
          selectedReceiptPassenger.mobile,
          'APPROVED',
          selectedReceiptPassenger.name,
          selectedReceiptPassenger.tourName
        );

        setIsReceiptModalOpen(false);
        setSelectedReceiptPassenger(null);
        alert('فیش مسافر با موفقیت تایید و ثبت شد ✅');
        window.location.reload(); // رفرش برای بروزرسانی لیست
      } else {
        alert('خطا در ثبت اطلاعات: ' + res.message);
      }
    } catch (error) {
      console.error(error);
      alert('خطا در تایید فیش و واریزی ❌');
    }
  };

  // تابع رد فیش
  const handleRejectReceipt = async (passengerId: string) => {
    if (!rejectReason.trim()) {
      alert('لطفاً علت رد فیش را وارد کنید');
      return;
    }
    try {
      const statusWithReason = `رد شده (${rejectReason.trim()})`;
      await handleSaveSingleStatus(passengerId, statusWithReason);
      setIsReceiptModalOpen(false);
      setSelectedReceiptPassenger(null);
      setShowRejectInput(false);
      setRejectReason('');
      alert('فیش با موفقیت رد شد ❌');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('خطا در ثبت رد فیش');
    }
  };

const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


// خروجی اکسل لیست مسافران (بهینه شده با Lazy-load و RTL)
  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
   const dataToExcel = filteredPassengers.map((p: any, index: any) => ({
      'ردیف': index + 1,
      'نام مسافر': p.fullName,
      'کد ملی': p.nationalId,
      'تلفن تماس': p.mobile,
      'نوع تور': p.tourName,
      'تعداد نفرات': p.seatsCount || p.seats || 1,
      'تاریخ پرداخت': p.receiptDate || '',
      'تاریخ و ساعت ثبت': p.createdAt 
        ? new Date(p.createdAt).toLocaleString('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '',
      'مبلغ واریزی': p.amount || '',
      'وضعیت مالی': p.paymentStatus,
      'بیمه': p.insurance ? 'دارد' : 'ندارد',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'لیست مسافران');
    
    // تنظیم راست‌به‌چپ (RTL) برای نمایش عالی در اکسل
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ RTL: true });

    XLSX.writeFile(workbook, 'Passengers_List.xlsx');
  };
  
// خروجی اکسل لیست بیمه (بهینه شده با Lazy-load و RTL)
  const exportInsuranceToExcel = async () => {
    const XLSX = await import('xlsx');
  const insurancePassengers = filteredPassengers.filter((p: any) => p.insurance === true);
    const dataToExcel = insurancePassengers.map((p: any, index: any) => ({
      'ردیف': index + 1,
      'نام و نام خانوادگی': p.fullName,
      'کد ملی': p.nationalId,
      'تاریخ تولد': (p as any).birthDate || '',
      'شماره تماس': p.mobile,
      'عنوان تور': p.tourName,
      'تعداد نفرات': p.seatsCount || p.seats || 1
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'لیست بیمه');

    // تنظیم راست‌به‌چپ (RTL) برای لیست بیمه
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ RTL: true });

    XLSX.writeFile(workbook, 'Insurance_list.xlsx');
  };


// تابع کمکی برای فراخوانی API پیامک
const sendSmsNotification = async (
  mobile: string, 
  type: 'APPROVED' | 'REJECTED', 
  passengerName: string, 
  tourName: string, 
  reason?: string
) => {
  try {
    await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, type, passengerName, tourName, reason }),
    });
  } catch (err) {
    console.error('خطا در ارسال پیامک:', err);
  }
};

const handleGenerateAi = async (tourId: string, tourName: string, days: number = 3, category: string = "طبیعت‌گردی") => {
  setSelectedTourName(tourName);
  setIsAiModalOpen(true);
  setIsLoading(true);

  try {
    const res = await fetch("/api/generate-tour", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tourName, days, category }),
    });

    const result = await res.json();
    if (result.success) {
      const data = result.data;

      // ۱. برنامه سفر (تب اول)
      const itinerary = data.dayByDay?.[0] || data.tourPlan || data.dayByDay || 'برنامه سفر آماده شد.';
      setTourPlanData(itinerary);

      // ۲. کپشن اینستاگرام (تب سوم - عدم تکرار متن برنامه سفر)
      const instagramCaption = data.caption || 
        `📸 **کپشن اینستاگرام تور ${tourName}**\n\nاماده‌ای برای یک سفر بی‌نظیر ${days} روزه به ${tourName}؟ 🔥\n\n✨ **ویژگی‌های این سفر:**\n- برنامه گشت کامل و حرفه‌ای\n- اقامتگاه و لیدر مجرب\n- عکاسی و خاطره‌سازی در طبیعت\n\n📌 **برای ثبت‌نام و دریافت اطلاعات بیشتر دایرکت پیام بدید!**\n\n#تور #${tourName.replace(/\s+/g, '_')} #گردشگری #سفر_گروهی`;

      setPromoData(instagramCaption);

      // ۳. تب مشاوره و چت (تب دوم)
      setConsultData("سلام! من دستیار هوشمند این تور هستم. هر سوالی درباره تجهیزات، شرایط سفر یا نکات ایمنی داری بپرس تا راهنماییت کنم.");

    } else {
      alert("خطا در دریافت اطلاعات: " + result.error);
    }
  } catch (err: any) {
    alert("خطا در ارتباط: " + err.message);
  } finally {
    setIsLoading(false);
  }
};

  /// تابع ارسال دستور جدید بر اساس تب فعال
  const handleCustomPromptSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customPrompt.trim()) return;

    setIsLoading(true);

    try {
      // تفکیک دستور بر اساس تب فعال کاربر تا هوش مصنوعی دقیقا همون رو تولید کنه
      let promptToSend = customPrompt;
      if (aiTab === 'promoText') {
        promptToSend = `لطفاً یک کپشن جذاب و تبلیغاتی اینستاگرام برای این تور بنویس: ${customPrompt}`;
      } else if (aiTab === 'packingList') {
        promptToSend = `به عنوان راهنمای تور و مشاور سفر، به این سوال پاسخ بده: ${customPrompt}`;
      }

      const res = await fetch("/api/generate-tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourName: selectedTourName,
          days: 3,
          category: "طبیعت‌گردی",
          customInstruction: promptToSend,
        }),
      });

      const result = await res.json();
      if (result.success) {
        const rd = result.data;

        // ذخیره دقیق پاسخ در استیتِ همان تب فعال
        if (aiTab === 'dayByDay') {
          setTourPlanData(rd.dayByDay?.[0] || rd.tourPlan || rd.promoText || '');
        } else if (aiTab === 'packingList') {
          // تب مشاوره آزاد و چت
          const chatAnswer = rd.consult || rd.answer || rd.promoText || rd.dayByDay?.[0] || "پاسخی از هوش مصنوعی دریافت شد.";
          setConsultData(chatAnswer);
        } else if (aiTab === 'promoText') {
          // تب کپشن اینستاگرام
          setPromoData(rd.caption || rd.promoText || rd.dayByDay?.[0] || '');
        }

        setCustomPrompt(""); 
      } else {
        alert("خطا در هوش مصنوعی: " + result.error);
      }
    } catch (err: any) {
      alert("خطا در ارتباط: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
// تبدیل اعداد انگلیسی به فارسی برای نمایش روان به کاربر
const toPersianDigits = (num: string | number) => {
  if (num === null || num === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

const toEnglishDigits = (str: string) => {
  if (!str) return '';
  return String(str).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
};

// تابع هوشمند برای اسلاش‌گذاری خودکار تاریخ (فرمت 1405/08/04)
const handleSmartDateChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<any>>, fieldName: string) => {
  let value = e.target.value.replace(/\D/g, ''); // فقط اعداد را نگه دار
  
  if (value.length > 4 && value.length <= 6) {
    value = value.slice(0, 4) + '/' + value.slice(4);
  } else if (value.length > 6) {
    value = value.slice(0, 4) + '/' + value.slice(4, 6) + '/' + value.slice(6, 8);
  }

  setter((prev: any) => ({ ...prev, [fieldName]: value }));
};



  return (
    <div className="min-h-screen bg-[#F9704E] p-3 sm:p-6 md:p-12 text-white font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#1e1e1e] p-4 sm:p-6 rounded-2xl border border-[#E5C060] shadow-xl text-center md:text-right">
<div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 mb-4">
  
  {/* لوگو و عنوان در موبایل با فاصله بسیار کم */}
  <div className="flex items-center gap-2 sm:gap-3">
    <img 
      src="/logo.png" 
      className="h-12 sm:h-16 w-auto object-contain" 
      alt="Lidera Logo" 
    />
    <div>
<h1 className="text-base sm:text-xl font-bold text-white tracking-tight" dir="rtl">
  {initialLeader?.fullName || initialLeader?.name || leaderName ? `${initialLeader?.fullName || initialLeader?.name || leaderName} عزیز، خوش آمدید!` : 'خوش آمدید!'}
</h1>
</div>
    </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 w-full lg:w-auto">

                     
            <button onClick={() => setIsTourModalOpen(true)} title="مدیریت تورها" className="flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-[#F9704E] p-2.5 rounded-xl transition-all border border-zinc-800 active:scale-95 cursor-pointer flex-1 sm:flex-none">
              <FaMapMarkedAlt size={18} />

            </button>
          

          
  {/* دکمه افزودن مسافر (تبدیل به آیکون مربعی یک‌دست) */}
<button 
  onClick={() => openAddModal()} 
  title="افزودن مسافر جدید" 
  className="flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-orange-500 p-2.5 rounded-xl transition-all shadow-md active:scale-95 border border-zinc-800 cursor-pointer"
>
  <FaUserPlus size={16} />
</button>


            <button onClick={() => setIsChangePassModalOpen(true)} title="تغییر رمز" className="flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-[#E5C060] p-2.5 rounded-xl transition-all shadow-md active:scale-95 border border-zinc-800 cursor-pointer flex-1 sm:flex-none">
              <FaKey size={14} />
            </button>

{/* خروجی اکسل مسافران (تبدیل به آیکون یکدست) */}
  <button onClick={exportToExcel} title="دانلود اکسل مسافران" className="flex items-center justify-center bg-emerald-950/40 hover:bg-emerald-900 text-emerald-400 p-2.5 rounded-xl transition-all border border-emerald-900/50 active:scale-95 cursor-pointer flex-1 sm:flex-none">
    <FaFileExcel size={16} />
  </button>

  {/* خروجی اکسل بیمه (تبدیل به آیکون یکدست) */}
  <button onClick={exportInsuranceToExcel} title="دانلود لیست بیمه (Excel)" className="flex items-center justify-center bg-blue-950/40 hover:bg-blue-900 text-blue-400 p-2.5 rounded-xl transition-all border border-blue-900/50 active:scale-95 cursor-pointer flex-1 sm:flex-none">
    <FaShieldAlt size={16} />
  </button>

<button 
  onClick={handleLogout} 
  disabled={isLoggingOut}
  title="خروج از پنل" 
  className="flex items-center justify-center bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 p-2.5 rounded-xl transition-all shadow-md active:scale-95 border border-rose-800/40 disabled:opacity-50 cursor-pointer"
>
  {isLoggingOut ? (
    <span className="text-[10px] animate-pulse">در حال خروج...</span>
  ) : (
    <FaSignOutAlt size={14} />
  )}
</button>
          </div>
        </div>

        {/* بخش تنظیمات مالی و کارت‌های بانکی لیدر */}
        <div className="mb-6 bg-[#1e1e1e] p-5 rounded-2xl border-2 border-[#E5C060] shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F9704E]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FaCreditCard className="text-[#F9704E]" /> تنظیمات مالی و شماره کارت‌ها 
            </h2>
<button 
  onClick={handleSaveFinancialSettings} 
  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
>
  <FaCheck size={11} className="sm:text-xs" /> 
  <span>ذخیره </span>
</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-300 mb-2 font-medium">نوع پرداخت پذیرفته‌شده:</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-zinc-900 border border-[#F9704E] p-3 rounded-xl text-xs text-white focus:outline-none focus:border-[#F9704E]"
              >
                <option value="card">فقط کارت به کارت</option>
                <option value="gateway">فقط درگاه آنلاین</option>
                <option value="both">هر دو روش (آنلاین و کارت به کارت)</option>
              </select>
            </div>
          </div>

          {(paymentMethod === 'card' || paymentMethod === 'both') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">مدیریت شماره کارت‌ها (حداکثر ۴ کارت):</span>
                {leaderCards.length < 4 && (
                  <button type="button" onClick={handleAddCard} className="bg-zinc-900 hover:bg-zinc-800 text-[#F9704E] border border-[#F9704E] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <FaPlus size={10} /> افزودن کارت جدید
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {leaderCards.map((card, idx) => (
                  <div key={card.id || idx} className="bg-zinc-900 p-3 rounded-xl border border-[#F9704E] space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-zinc-400">کارت شماره {idx + 1}</span>
                      {leaderCards.length > 1 && (
                        <button type="button" onClick={() => handleDeleteCard(idx)} className="text-rose-500 hover:text-rose-400 text-xs cursor-pointer">
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        maxLength={16} 
                        placeholder="شماره کارت (۱۶ رقمی)" 
                        value={card.cardNumber} 
                        onChange={(e) => handleCardChange(idx, 'cardNumber', e.target.value.replace(/[^0-9]/g, ''))}
                        className="bg-zinc-800 border border-[#F9704E] p-2.5 rounded-lg text-xs text-left font-mono text-white placeholder-zinc-500"
                        style={{ direction: 'ltr' }}
                      />
                      <input 
                        type="text" 
                        placeholder="نام بانک (مثلا: پاسارگاد)" 
                        value={card.bankName} 
                        onChange={(e) => handleCardChange(idx, 'bankName', e.target.value)}
                        className="bg-zinc-800 border border-[#F9704E]  p-2.5 rounded-lg text-xs text-white placeholder-zinc-500"
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="نام صاحب کارت (اختیاری)" 
                      value={card.cardHolder} 
                      onChange={(e) => handleCardChange(idx, 'cardHolder', e.target.value)}
                      className="w-full bg-zinc-800 border border-[#F9704E] p-2 rounded-lg text-xs text-white placeholder-zinc-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

{/* نوار جستجو و فیلتر */}
{/* نوار جستجو و فیلتر */}
        <div className="mb-6 bg-[#1e1e1e] p-4 rounded-2xl border-2 border-[#E5C060] shadow-xl flex flex-col md:flex-row items-center justify-between gap-4" dir="left">
          <div className="flex flex-wrap items-center justify-start gap-3 w-full md:w-auto">
            {/* فیلتر وضعیت پرداخت */}
            <div className="flex items-center gap-2">
              <FaFilter className="text-zinc-500 text-xs" />
              <select 
                value={statusFilter} 
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} 
                className="bg-zinc-900 border border-[#F9704E] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="پرداخت شده">پرداخت شده</option>
                <option value="بیعانه">بیعانه</option>
                <option value="در انتظار پرداخت">در انتظار پرداخت</option>
              </select>
            </div>

            
            {/* دکمه حذف کلی */}
            <button 
              onClick={handleDeleteAllRecords} 
              title="حذف کلی رکوردها" 
              className="p-2.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-white border border-rose-900/50 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <FaTrash size={15} />
            </button>
            
            {/* تعداد کل */}
            <div className="text-xs text-white font-medium">
              تعداد: <span className="text-[#F9704E] font-bold font-mono">{filteredPassengers.length}</span> نفر
            </div>
          </div>

          {/* باکس جستجو */}
          <div className="relative w-full sm:w-64 max-w-xs">
            <FaSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={handleSearchChange} 
              placeholder="جستجو نام، کدملی، تور..." 
              className="w-full bg-zinc-900 border-2 border-[#F9704E] rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F9704E] transition-all" 
            />
          </div>
        </div>
{/* جدول مسافران */}
<div className="bg-[#1e1e1e] rounded-2xl border-2 border-[#E5C060] shadow-xl overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-right border-collapse">
      <thead className="bg-[#2a2a2a] text-white text-xs sm:text-sm">
        <tr>
          <th className="p-3 sm:p-4 font-bold text-right">نام مسافر و کد ملی</th>
          <th className="p-3 sm:p-4 font-bold text-center">تلفن تماس</th>
          <th className="p-3 sm:p-4 font-bold text-center">عنوان تور</th>
          <th className="p-3 sm:p-4 font-bold text-center">تاریخ، مبلغ و تصویر فیش</th>
          <th className="p-3 sm:p-4 font-bold text-center">عملیات</th>
          <th className="p-3 sm:p-4 font-bold text-center">وضعیت مالی</th>
          <th className="p-3 sm:p-4 font-bold text-center">بیمه</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800 text-white text-xs">
        {paginatedPassengers.length === 0 ? (
          <tr>
            <td colSpan={7} className="p-8 text-center text-zinc-500">هیچ مسافری یافت نشد!</td>
          </tr>
        ) : (
          paginatedPassengers.map((p: any) => {
            const isChanged = p.paymentStatus !== p.originalPaymentStatus;
            const displaySeats = p.seatsCount || p.seats || 1;
            return (
              <tr key={p.id} className="hover:bg-zinc-900/50 transition-colors">
                {/* ستون ۱: نام مسافر و کد ملی */}
                <td className="p-3 sm:p-4">
                  <div className="font-bold text-white text-xs sm:text-sm flex items-center justify-between">
                    <span>{p.fullName}</span>
                    <span className="text-[10px] bg-[#F9704E]/20 text-[#F9704E] border border-[#F9704E]/30 px-1.5 py-0.5 rounded-md font-mono mr-1">
                      {displaySeats} نفره
                    </span>
                  </div>
                  <div className="text-zinc-400 mt-0.5 text-[11px]">کد ملی: {p.nationalId}</div>
                  {p.createdAt && (
                    <div className="text-[10px] text-[#E5C060] font-mono mt-1 flex items-center gap-1">
                      <span>⏰ ثبت:</span>
                      {new Date(p.createdAt).toLocaleDateString('fa-IR')} - {new Date(p.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </td>

                {/* ستون ۲: تلفن تماس + دکمه کپی */}
                <td className="p-3 sm:p-4 font-mono text-zinc-300 text-[11px] sm:text-xs" style={{ direction: 'ltr', textAlign: 'right' }}>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span>{p.mobile || 'ثبت نشده'}</span>
                    {p.mobile && (
                      <button
                        onClick={() => handleCopyText(p.mobile)}
                        className="text-zinc-400 hover:text-white transition-colors text-[10px] p-1 rounded bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
                        title="کپی شماره تماس"
                      >
                        📋
                      </button>
                    )}
                  </div>
                </td>

                {/* ستون ۳: عنوان تور */}
                <td className="p-3 sm:p-4 text-center font-medium">{p.tourName}</td>
                
                {/* ستون ۴: تاریخ، مبلغ و تصویر فیش */}
           {/* ستون ۴: تاریخ، مبلغ و تصویر فیش */}
            <td className="p-3 sm:p-4 text-center">
              <div className="text-zinc-300 font-mono text-[11px]">{toPersianDigits(p.receiptDate || '-')}</div>
              <div className="font-mono text-xs text-emerald-400 font-bold mt-0.5">
                {p.amount ? toPersianDigits(Number(String(p.amount).replace(/[^0-9]/g, '')).toLocaleString()) + ' تومان' : '۰ تومان'}
              </div>
              {p.receiptImage && (
                   
                   <button
                      onClick={() => {
                        setSelectedReceiptPassenger(p);
                        setIsReceiptModalOpen(true);
                      }}
                      className="mt-1 text-[10px] text-[#F9704E] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <FaImage size={11} /> مشاهده فیش
                    </button>
                  )}
                </td>

                {/* ستون ۵: عملیات (ویرایش و حذف) */}
                <td className="p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => openEditModal(p)} title="ویرایش" className="p-2 bg-zinc-900 hover:bg-zinc-800 text-blue-400 rounded-xl transition-all border border-zinc-800 cursor-pointer">
                      <FaEdit size={13} />
                    </button>
                    <button onClick={() => handleDeletePassenger(p.id)} title="حذف" className="p-2 bg-zinc-900 hover:bg-zinc-800 text-rose-500 rounded-xl transition-all border border-zinc-800 cursor-pointer">
                      <FaTrash size={13} />
                    </button>
                  </div>
                </td>

                {/* ستون ۶: وضعیت مالی */}
                <td className="p-3 sm:p-4 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <select 
                      value={p.paymentStatus} 
                      onChange={(e) => handleInlineStatusChange(p.id, e.target.value)}
                      className="bg-zinc-900 border border-[#F9704E] rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none cursor-pointer"
                    >
                      <option value="پرداخت شده">پرداخت شده</option>
                      <option value="بیعانه">بیعانه</option>
                      <option value="در انتظار پرداخت">در انتظار پرداخت</option>
                    </select>
                    {isChanged && (
                      <button onClick={() => handleSaveSingleStatus(p.id, p.paymentStatus)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] flex items-center gap-1 shadow transition-all cursor-pointer">
                        <FaCheck size={9} /> ثبت
                      </button>
                    )}
                  </div>
                </td>

                {/* ستون ۷: بیمه */}
                <td className="p-3 sm:p-4 text-center">
                  {p.insurance ? (
                    <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded-md text-[10px]">دارد</span>
                  ) : (
                    <span className="bg-zinc-950/50 text-zinc-500 border border-[#F9704E] px-2 py-0.5 rounded-md text-[10px]">ندارد</span>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
</div>
{/* --- مودال افزودن مسافر (با فیش واریزی کامل) --- */}
        {/* --- مودال افزودن مسافر (با فیش واریزی کامل) --- */}
{isAddModalOpen && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
 <div className="w-full max-w-lg bg-[#121214] border-2 border-[#E5C060] rounded-[28px] p-6 shadow-2xl overflow-y-auto max-h-[90vh] overflow-hidden relative isolate">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FaUserPlus className="text-[#F9704E]" /> افزودن مسافر جدید
        </h3>
        <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
          <FaTimes size={16} />
        </button>
      </div>

              <form onSubmit={handleSaveNewPassenger} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm text-zinc-300 mb-1.5 font-bold">نام و نام خانوادگی:</label>
                  <input type="text" required value={addFormData.fullName} onChange={(e) => setAddFormData({ ...addFormData, fullName: e.target.value })} className="w-full bg-zinc-300  border border-orange-600 p-2.5 rounded-xl text-xs text-black placeholder-white/70" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>

                <div>

  <label className="block text-xs text-zinc-300 mb-1.5 font-medium">شماره موبایل:</label>
  <input 
    type="text"
    maxLength={11}
    dir="ltr"
    required
    value={addFormData.phone}
    onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
   
  />
</div>


  <label className="block text-xs text-zinc-300 mb-1.5 font-medium">کد ملی:</label>
  <input 
    type="text"
    maxLength={10}
    dir="ltr"
    required
    value={addFormData.nationalId}
    onChange={(e) => setAddFormData({ ...addFormData, nationalId: e.target.value })}
    className="w-full bg-zinc-300 border border-orange-600 p-2.5 rounded-xl text-xs font-mono text-black font-bold text-right focus:outline-none"
  />
</div>
</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5 font-medium">انتخاب تور:</label>
<select
  value={editFormData.tourName || ''}
  onChange={(e) => {
    const selectedTour = e.target.value;
    calculateEditAmount(selectedTour, Number(editFormData.seats || 1));
  }}
  className="w-full bg-zinc-300 border border-orange-600 p-2.5 rounded-xl text-xs font-mono text-black font-bold text-right focus:outline-none"
>
  {activeTours.map((tour: any, idx: number) => (
    <option key={idx} value={tour.name}>
      {tour.name} - ({tour.price} تومان)
    </option>
  ))}
</select>
                  </div>
<div>
  <label className="block text-xs text-zinc-300 mb-1.5 font-medium">تعداد صندلی/نفرات:</label>
  <div className="flex items-center gap-1.5">
    {/* دکمه منفی */}
    <button
      type="button"
      onClick={() => {
        const newVal = Math.max(1, Number(addFormData.seats) - 1);
        setAddFormData((prev: any) => ({ ...prev, seats: newVal }));
        calculateAddAmount(addFormData.tourName, newVal);
      }}
      className="bg-zinc-800  hover:bg-zinc-300 text-white w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-colors shrink-0 cursor-pointer"
    >
      -
    </button>

    {/* اینپوت تعداد بدون فلش‌های مزاحم مرورگر */}
    <input 
      type="number" 
      min={1} 
      value={addFormData.seats} 
      onChange={(e) => {
        const val = Math.max(1, Number(e.target.value));
        setAddFormData((prev: any) => ({ ...prev, seats: val }));
        calculateAddAmount(addFormData.tourName, val);
      }} 
      className="w-full bg-zinc-300  border border-orange-600 p-2.5 rounded-xl text-xs font-mono text-black font-bold text-center focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
    />

    {/* دکمه مثبت */}
    <button
      type="button"
      onClick={() => {
        const newVal = Number(addFormData.seats) + 1;
        setAddFormData((prev: any) => ({ ...prev, seats: newVal }));
        calculateAddAmount(addFormData.tourName, newVal);
      }}
      className="bg-zinc-800 hover:bg-zinc-700 text-white w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-colors shrink-0 cursor-pointer"
    >
      +
    </button>
  </div>
</div>
</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5 font-medium">وضعیت مالی:</label>
                    <select value={addFormData.paymentStatus} onChange={(e) => setAddFormData({ ...addFormData, paymentStatus: e.target.value })} className="w-full  bg-zinc-300 border border-orange-600 p-2.5 rounded-xl text-xs text-black">
                      <option value="پرداخت شده" className="bg-zinc-300 text-black">پرداخت شده</option>
                      <option value="بیعانه" className="bg-zinc-300 text-black">بیعانه</option>
                      <option value="در انتظار پرداخت" className="bg-zinc-300 text-black">در انتظار پرداخت</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5 font-medium">مبلغ واریزی (تومان):</label>
                    <input type="text" value={addFormData.amount} onChange={(e) => setAddFormData({ ...addFormData, amount: e.target.value })} className="w-full  bg-zinc-300 border border-orange-600 p-2.5 rounded-xl text-xs font-mono text-black" />
                  </div>
                </div>
<div>
 <div>
  
                <label className="block text-xs text-zinc-300 mb-1.5 font-medium">تاریخ پرداخت:</label>
                <input
                  type="text"
                  maxLength={10}
                  value={toPersianDigits(addFormData.receiptDate || '')}
                  onChange={(e) => handleSmartDateChange(e, setAddFormData, 'receiptDate')}
                  placeholder="۱۴۰۵/۰۷/۰۹"
                  className="w-full bg-zinc-300 border border-orange-600 p-2.5 rounded-xl text-xs font-mono text-black font-bold text-right focus:outline-none"

                  
                />
              </div>
</div>

                {/* بخش فیش واریزی در افزودن */}
                <div>
                  <label className="block text-xs text-zinc-300 mb-1.5 font-medium">بارگذاری تصویر فیش:</label>
                  
                  {addFormData.receiptImage && (
                    <div className="flex items-center justify-between bg-zinc-300  border border-orange-600 p-2 rounded-xl mb-2 text-xs">
                      <span className="text-black truncate max-w-200px]">فیش ثبت شده/انتخاب شده</span>
                      <button
                        type="button"
                        onClick={() => setAddFormData((prev: any)=> ({ ...prev, receiptImage: '' }))}
                        className="bg-zinc-900 text-rose-400 border border-zinc-800 px-2 py-1 rounded-lg text-[10px]"
                      >
                        حذف فیش
                      </button>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, false)}
                    className="w-full bg-zinc-300  border border-orange-600 p-2 text-[11px] text-white file:bg-zinc-900 file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1 rounded-xl cursor-pointer"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={addFormData.insurance} onChange={(e) => setAddFormData({ ...addFormData, insurance: e.target.checked })} className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-[#F9704E] focus:ring-0" />
                    <span className="text-xs text-zinc-300">بیمه حوادث دارد</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-800">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all">انصراف</button>
                  <button type="submit" className="bg-[#e05f3e]  hover:bg-[#e05f3e] text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer transition-all shadow-lg">افزودن مسافر</button>
                </div>
              </form>
            </div>
          </div>
        )}

       {/* --- مودال ویرایش مسافر (با فیش واریزی کامل) --- */}
{isEditModalOpen && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
  <div className="w-full max-w-lg bg-[#121214] border-2 border-[#E5C060] rounded-[28px] p-6 shadow-2xl overflow-y-auto max-h-[90vh] overflow-hidden relative isolate">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FaEdit className="text-[#F9704E]" /> ویرایش اطلاعات مسافر
        </h3>
        <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
          <FaTimes size={16} />
        </button>
      </div>

              <form onSubmit={handleUpdatePassenger} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm text-zinc-300 mb-1.5 font-bold">نام و نام خانوادگی:</label>
                  <input type="text" required value={editFormData.fullName} onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })} className="w-full bg-zinc-300 border border-orange-600 p-2.5 rounded-xl text-xs text-black placeholder-white/70" />
                </div>



<div>
  <label className="block text-xs text-zinc-300 mb-1.5 font-medium">شماره موبایل:</label>
  <input 
    type="text" 
    maxLength={11} 
    dir="ltr"
    required 
    value={editFormData.phone} 
    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} 
    className="w-full bg-zinc-300 border border-orange-600 p-2.5 rounded-xl text-xs font-mono text-black font-bold text-right focus:outline-none"
  />
</div>

<div>
  <label className="block text-xs text-zinc-300 mb-1.5 font-medium">کد ملی:</label>
  <input 
    type="text" 
    maxLength={10} 
    dir="ltr"
    required 
    value={editFormData.nationalId} 
    onChange={(e) => setEditFormData({ ...editFormData, nationalId: e.target.value })} 
    className="w-full bg-zinc-300 border border-orange-600 p-2.5 rounded-xl text-xs font-mono text-black font-bold text-right focus:outline-none"
  />
</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5 font-medium">انتخاب تور:</label>
                    <select 
                      value={editFormData.tourName} 
onChange={(e) => {
  const selectedTour = e.target.value;
  calculateEditAmount(selectedTour, Number(editFormData.seats || 1));
}}
                      className="w-full bg-zinc-300 border border-orange-600 p-2.5 rounded-xl text-xs text-black"
                    >
                     {activeTours.map((t: any, idx: any) => (
                        <option key={t.id || idx} value={t.name} className="bg-zinc-300 text-black">{t.name}</option>
                      ))}
                    </select>
                  </div>
                 <div>
  <label className="block text-xs text-zinc-300 mb-1.5 font-medium">تعداد صندلی/نفرات:</label>
  <div className="flex items-center gap-1.5">
   {/* دکمه منفی */}
<button
  type="button"
  onClick={() => {
    const newSeats = Math.max(1, Number(editFormData.seats || 1) - 1);
    calculateEditAmount(editFormData.tourName, newSeats);
  }}
  className="px-3 py-1 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
>
  -
</button>

{/* نمایش تعداد صندلی */}
<input
  type="text"
  value={editFormData.seats || 1}
  readOnly
  className="w-12 text-center bg-transparent text-white font-bold"
/>

{/* دکمه مثبت */}
<button
  type="button"
  onClick={() => {
    const newSeats = Number(editFormData.seats || 1) + 1;
    calculateEditAmount(editFormData.tourName, newSeats);
  }}
  className="px-3 py-1 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
>
  +
</button>
  </div>
</div>
</div>
{/* وضعیت مالی و مبلغ (مبلغ به صورت خودکار و غیرقابل ویرایش دستی مستقیم جهت جلوگیری از خطا) */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div>
      <label className="block text-xs text-zinc-300 mb-1.5 font-medium">وضعیت مالی:</label>
      <select 
        value={editFormData.paymentStatus || 'در انتظار پرداخت'} 
        onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value })} 
        className="w-full bg-zinc-300 border border-orange-600 p-2.5 rounded-xl text-xs text-black font-bold"
      >
        <option value="پرداخت شده">پرداخت شده ✓</option>
        <option value="در انتظار پرداخت">در انتظار پرداخت ⏳</option>
        <option value="رد شده">رد شده ✕</option>
      </select>
    </div>

   {/* محاسبه پویا و قابلیت ویرایش مبلغ بر اساس تعداد صندلی و تور */}
{/* بخش مبلغ واریزی */}
<div className="space-y-1">
  <label className="block text-xs text-zinc-300 mb-1.5 font-medium">مبلغ واریزی (محاسبه خودکار و قابل ویرایش):</label>
  <input
    type="text"
    value={toPersianDigits(editFormData.amount ? Number(editFormData.amount).toLocaleString() : '') + (editFormData.amount ? ' تومان' : '')}
    onChange={(e) => {
      const rawVal = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
      setEditFormData((prev: any) => ({ ...prev, amount: rawVal }));
    }}
    placeholder="مبلغ به تومان"
    className="w-full bg-zinc-800 border border-zinc-700 text-emerald-400 font-bold p-2.5 rounded-xl text-xs font-mono text-right focus:outline-none focus:border-amber-500"
  />
</div>

{/* بخش تاریخ پرداخت */}
<div className="space-y-1">
  <label className="block text-xs text-zinc-300 mb-1.5 font-medium">تاریخ پرداخت:</label>
  <input
    type="text"
    maxLength={10}
    value={toPersianDigits(editFormData.receiptDate || '')}
    onChange={(e) => handleSmartDateChange(e, setEditFormData, 'receiptDate')}
    placeholder="۱۴۰۵/۰۷/۱۸"
    className="w-full bg-zinc-300 border border-orange-600 p-2.5 rounded-xl text-xs font-mono text-black font-bold text-right focus:outline-none"
  />
</div>
</div>
               {/* بخش فیش واریزی در ویرایش */}
                <div>
                  <label className="block text-xs text-zinc-300 mb-1.5 font-medium">بارگذاری تصویر فیش:</label>
                  
                  {editFormData.receiptImage && (
                    <div className="flex items-center justify-between bg-zinc-300 border border-orange-600 p-2 rounded-xl mb-2 text-xs">
                      <span className="text-black truncate max-w-200px]">فیش ثبت شده/انتخاب شده</span>
                      <button 
                        type="button" 
                        onClick={() => setEditFormData((prev: any)=> ({ ...prev, receiptImage: '' }))}
                        className="bg-zinc-900 text-rose-400 border border-zinc-800 px-2 py-1 rounded-lg text-[10px]"
                      >
                        حذف فیش
                      </button>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, true)}
                    className="w-full bg-zinc-300  border border-orange-600 p-2 text-[11px] text-black file:bg-zinc-900 file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1 rounded-xl cursor-pointer"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editFormData.insurance} onChange={(e) => setEditFormData({ ...editFormData, insurance: e.target.checked })} className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-[#F9704E] focus:ring-0" />
                    <span className="text-xs text-zinc-300">بیمه حوادث دارد</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-800">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-zinc-600 hover:bg-zinc-600 text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all">انصراف</button>
                  <button type="submit" className="bg-[#F9704E] hover:bg-[#e05f3e] text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer transition-all shadow-lg">ذخیره تغییرات</button>
                </div>
              </form>
            </div>
          </div>
        )}
       {/* مودال مدیریت تورها */}
        {isTourModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1e1e1e] border border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FaMapMarkedAlt className="text-[#F9704E]" /> مدیریت تورهای فعال
                </h3>
                <button onClick={() => setIsTourModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <FaTimes size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <form onSubmit={handleAddTour} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-zinc-300">افزودن تور جدید:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input 
                      type="text" 
                      placeholder="عنوان تور (مثلا: تور کویر)" 
                      value={newTourName} 
                      onChange={(e) => setNewTourName(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-lg text-xs text-white"
                    />
                    <input 
                      type="text" 
                      placeholder="تاریخ تور (اختیاری)" 
                      value={newTourDate} 
                      onChange={(e) => setNewTourDate(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-lg text-xs text-white font-mono"
                    />
                    <input 
                      type="text" 
                      placeholder="قیمت هر صندلی (تومان)" 
                      value={newTourPrice} 
                      onChange={(e) => setNewTourPrice(e.target.value.replace(/[^0-9]/g, ''))}
                      className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                     <button type="submit" className="w-full bg-[#F9704E] hover:bg-orange-600 text-white p-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer">
                    ثبت تور جدید در لیست
                  </button>
                </form>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-400">تورهای فعلی ثبت شده:</div>
                  {activeTours.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500 text-xs">هیچ توری ثبت نشده است.</div>
                  ) : (
                    activeTours.map((t:any, idx:any) => (
                      <div key={t.id || idx} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          {editingTourIndex === idx ? (
                            <div className="flex items-center gap-2 flex-1 ml-2">
                              <input 
                                type="text" 
                                value={editingTourNameValue} 
                                onChange={(e) => setEditingTourNameValue(e.target.value)}
                                className="bg-zinc-800 border border-zinc-700 p-1.5 rounded text-xs text-white flex-1"
                              />
                              <input 
                                type="text" 
                                value={editingTourPriceValue} 
                                placeholder="قیمت" 
                                onChange={(e) => setEditingTourPriceValue(e.target.value.replace(/[^0-9]/g, ''))}
                                className="bg-zinc-800 border border-zinc-700 p-1.5 rounded text-xs text-white w-24 font-mono"
                              />
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-white flex items-center gap-3">
                              <span>{t.name}</span>
                              {t.price && <span className="text-emerald-400 font-mono text-[11px]">({t.price} تومان)</span>}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            {editingTourIndex === idx ? (
                             
                             <button onClick={() => handleSaveEditTour(t.id, idx)} className="bg-emerald-600 text-white px-2.5 py-1 rounded text-[11px] cursor-pointer">
                                ذخیره
                              </button>
                            ) : (
                              <button onClick={() => handleStartEditTour(idx, t.name, (t as any).date || '', t.price ? String(t.price) : '')} className="p-1.5 bg-zinc-800 text-blue-400 rounded cursor-pointer">
                                <FaEdit size={12} />
                              </button>
                            )}
                            <button onClick={() => handleDeleteTour(t.id, t.name)} className="p-1.5 bg-zinc-800 text-rose-500 rounded cursor-pointer">
                              <FaTrash size={12} />
                            </button>
{/* دکمه اختصاصی جمینی (Gemini Sparkle) */}
<button
  onClick={() => handleGenerateAi(t.id || String(idx), t.name, 3, "طبیعت‌گردی")}
  title="ساخت برنامه سفر با هوش مصنوعی (Gemini)"
  className="p-1.5 bg-purple-900/60 hover:bg-purple-700 text-purple-200 border border-purple-500/50 rounded-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm group"
>
  {/* لوگوی رسمی ستاره جمینی */}
  <svg 
    viewBox="0 0 24 24" 
    className="w-3.5 h-3.5 fill-purple-300 group-hover:scale-110 transition-transform"
  >
    <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
  </svg>
</button>             
                         
                          </div>
                        </div>
                        {/* مدیریت تصاویر تور */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80">
                          {t.images?.map((img:any, imgIdx:any) => (
                            <div key={imgIdx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-700 group">
                              <Image src={img} alt="تصویر تور" fill className="object-cover" />
                              <button onClick={() => handleDeleteTourImage(idx, imgIdx)} className="absolute inset-0 bg-black/60 text-rose-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                <FaTrash size={10} />
                              </button>
                            </div>
                          ))}
                          {(!t.images || t.images.length < 4) && (
                            <label className="w-12 h-12 rounded-lg border border-dashed border-zinc-700 hover:border-[#F9704E] flex flex-col items-center justify-center text-zinc-400 hover:text-[#F9704E] cursor-pointer transition-all bg-zinc-800/40">
                              <FaUpload size={12} />
                              <span className="text-[9px] mt-0.5">افزودن</span>
                              <input type="file" accept="image/*" onChange={(e) => handleTourImageUpload(idx, e)} className="hidden" />
                           </label>

                         )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* مودال تغییر رمز عبور */}
        {isChangePassModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1e1e1e] border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FaKey className="text-[#E5C060]" /> تغییر رمز عبور پنل
                </h3>
                <button onClick={() => setIsChangePassModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <FaTimes size={15} />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-zinc-300 mb-1">رمز عبور فعلی:</label>
                  <input 
                    type="password" 
                    required
                    value={oldPasswordInput} 
                    onChange={(e) => setOldPasswordInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-300 mb-1">رمز عبور جدید:</label>
                  <input 
                    type="password" 
                    required
                    value={newPasswordInput} 
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-300 mb-1">تکرار رمز عبور جدید:</label>
                  <input 
                    type="password" 
                    required
                    value={confirmPasswordInput} 
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsChangePassModalOpen(false)} className="bg-zinc-800 text-zinc-300 px-3 py-2 rounded-xl text-xs cursor-pointer">
                    انصراف
                  </button>
                  <button type="submit" className="bg-[#E5C060] hover:bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer">
                    بروزرسانی رمز
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* مودال بزرگنمایی تصویر فیش */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-3xl max-h-[90vh] w-full h-full flex items-center justify-center">
              <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 bg-zinc-900/80 text-white p-3 rounded-full hover:bg-zinc-800 transition-all z-10 cursor-pointer">
                <FaTimes size={18} />
              </button>
              <div className="relative w-full h-full">
                <Image src={previewImage} alt="تصویر فیش واریزی بزرگ" fill className="object-contain rounded-xl" />
              </div>
            </div>
          </div>
        )}
    
      </div>


{/* مودال مشاهده و تایید فیش واریزی */}
      {isReceiptModalOpen && selectedReceiptPassenger && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 dir-rtl">
          <div className="w-full max-w-lg bg-[#121214] border border-[#E5C060] rounded-2xl p-4 sm:p-5 shadow-2xl relative max-h-[90vh] flex flex-col justify-between overflow-y-auto space-y-4">
            
            {/* هدر مودال */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2 text-[#E5C060]">
                بررسی فیش واریزی: {selectedReceiptPassenger.fullName}
              </h3>
              <button
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setShowRejectInput(false);
                }}
                className="text-zinc-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* جزئیات مسافر و محاسبه خودکار مبلغ برمبنای تعداد صندلی */}
{/* نمایش هوشمند مبلغ تور */}
<div className="space-y-3 text-xs sm:text-sm">
  <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-3 rounded-xl border border-[#F9704E]">
    <p><span className="text-zinc-500">شماره تماس:</span> {selectedReceiptPassenger?.mobile || selectedReceiptPassenger?.phone || 'ـ'}</p>
    <p>
      <span className="text-zinc-500">مبلغ تور (محاسبه خودکار): </span>
      <span className="text-emerald-400 font-bold">
{(() => {
  const dbAmount = selectedReceiptPassenger?.amount;
  if (dbAmount && dbAmount !== 'null' && dbAmount !== 'undefined' && dbAmount !== '') {
    return `${dbAmount} تومان`;
  }
  
  // استخراج قیمت تور از فیلدهای مسافر یا قیمت پیش‌فرض
  const tourPriceRaw = selectedReceiptPassenger?.tourPrice || selectedReceiptPassenger?.price || selectedReceiptPassenger?.tour?.price || 17890000;
  const rawPrice = parseInt(String(tourPriceRaw).replace(/[^0-9]/g, ''), 10) || 17890000;
  const seats = parseInt(String(selectedReceiptPassenger?.seatsCount || selectedReceiptPassenger?.seats || 1), 10);
  const calculated = rawPrice * seats;

  return `${calculated.toLocaleString('fa-IR')} تومان`;
})()}
      </span>
    </p>
    <p><span className="text-zinc-500">وضعیت فعلی:</span> <span className="text-amber-400">{selectedReceiptPassenger?.paymentStatus || 'در انتظار پرداخت'}</span></p>
    <p><span className="text-zinc-500">تعداد صندلی:</span> <span className="text-white font-bold">{selectedReceiptPassenger?.seatsCount || selectedReceiptPassenger?.seats || 1} صندلی</span></p>
  </div>

{/* Input برای تاریخ واریز دستی */}
{/* Input برای تاریخ واریز دستی */}
        <div className="space-y-1">
          <label className="block text-xs text-zinc-400 mb-1 font-medium">تاریخ واریز فیش (توسط لیدر):</label>
          <input
            type="text"
            maxLength={10}
            placeholder="۱۴۰۵/۰۷/۰۹"
            value={toPersianDigits(selectedReceiptPassenger?.receiptDate || '')}
            onChange={(e) => {
              const enVal = toEnglishDigits(e.target.value).replace(/\D/g, '');
              let formatted = enVal;
              if (enVal.length > 4 && enVal.length <= 6) {
                formatted = enVal.slice(0, 4) + '/' + enVal.slice(4);
              } else if (enVal.length > 6) {
                formatted = enVal.slice(0, 4) + '/' + enVal.slice(4, 6) + '/' + enVal.slice(6, 8);
              }
              setSelectedReceiptPassenger((prev: any) => ({
                ...prev,
                receiptDate: formatted
              }));
            }}
            className="w-full bg-[#5c5c5c] border border-[#F9704E]  rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F9704E] font-mono font-bold text-right"
          />
        </div>
        </div>
            {/* نمایش تصویر فیش (با ارتفاع کنترل شده جهت جلوگیری از اورفلو) */}
            <div className="bg-black/50 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center min-h-160px] max-h-240px] shrink-0">
              {selectedReceiptPassenger.receiptImage ? (
                <img
                  src={selectedReceiptPassenger.receiptImage}
                  alt="فیش واریزی"
                  className="w-full h-full object-contain max-h-240px]"
                />
              ) : (
                <p className="text-zinc-500 text-xs">تصویر فیش آپلود نشده است</p>
              )}
            </div>

            {/* فیلد علت رد فیش */}
            {showRejectInput && (
              <div className="space-y-2 animate-fadeIn shrink-0">
                <label className="block text-xs text-rose-400 font-medium">علت رد فیش را بنویسید:</label>
                <input
                  type="text"
                  placeholder="مثال: تصویر ناخوانا است یا مبلغ مغایرت دارد"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-zinc-900 border border-rose-600/60 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            )}

            {/* دکمه‌های عملیات (ثابت در انتهای مودال و همیشه قابل دیدن) */}
            <div className="flex items-center gap-3 pt-2 shrink-0 border-t border-zinc-800">
              {!showRejectInput ? (
                <>
                  <button
                    onClick={() => handleApproveReceipt(selectedReceiptPassenger.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-lg cursor-pointer"
                  >
                     تایید و ثبت نهایی ✓
                  </button>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="bg-rose-600/20 hover:bg-rose-600 border border-rose-600 text-rose-300 hover:text-white font-medium py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    رد فیش ✕
                  </button>
                </>
              ) : (
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => handleRejectReceipt(selectedReceiptPassenger.id)}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    ارسال علت و رد فیش
                  </button>
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="bg-zinc-800 text-zinc-300 py-2 px-3 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}


{/* مودال هوش مصنوعی */}
{isAiModalOpen && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
    <div className="bg-[#18181b] border-2 border-[#E5C060] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
      
      {/* هدر مودال */}
      <div className="p-4 border-b border-[#E5C060] flex items-center justify-between bg-zinc-900/50">
      <div className="flex flex-col items-center justify-center w-full">
  <h3 className="text-white font-bold text-base text-center">گزارش و چت هوشمند تور</h3>
</div>

        <button
          onClick={() => setIsAiModalOpen(false)}
          className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-lg font-bold"
        >
          ✕
        </button>
      </div>

      {/* تب‌ها و دکمه کپی */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/30 gap-2 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setAiTab('dayByDay')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              aiTab === 'dayByDay' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            📅 برنامه سفر
          </button>
          <button
            onClick={() => setAiTab('packingList')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              aiTab === 'packingList' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            🎒 مشاوره و نکات سفر
          </button>
          <button
            onClick={() => setAiTab('promoText')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              aiTab === 'promoText' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            ✨ کپشن اینستاگرام
          </button>
        </div>

        {/* دکمه کپی اختصاصی برای همان تب */}
        <button
          onClick={() => {
            const currentText =
              aiTab === 'dayByDay' ? tourPlanData :
              aiTab === 'packingList' ? consultData :
              promoData;

            if (!currentText) {
              alert("متنی برای کپی در این تب وجود ندارد!");
              return;
            }
            navigator.clipboard.writeText(currentText);
            alert("متن این تب کپی شد! 📋");
          }}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
        >
          📋 کپی متن
        </button>
      </div>

      {/* بدنه نمایش محتوای مستقل هر تب */}
      <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-220px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4 my-auto">
            <div className="flex space-x-2 space-x-reverse">
              <div className="w-4 h-4 bg-purple-500 rounded-md animate-bounce"></div>
              <div className="w-4 h-4 bg-purple-400 rounded-md animate-bounce [animation-delay:-.2s]"></div>
              <div className="w-4 h-4 bg-purple-300 rounded-md animate-bounce [animation-delay:-.4s]"></div>
            </div>
            <p className="text-sm text-purple-200 animate-pulse font-medium">
              در حال پردازش هوش مصنوعی...
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl text-zinc-200 text-sm leading-relaxed min-h-180px] whitespace-pre-line">
            {aiTab === "dayByDay" && (tourPlanData || "برنامه روزانه سفر هنوز ساخته نشده است.")}
            {aiTab === "packingList" && (consultData || "سوال یا درخواست مشاوره‌ای ثبت نکرده‌اید. کادر پایین را پر کنید!")}
            {aiTab === "promoText" && (promoData || "کپشن اینستاگرامی ثبت نشده است.")}
          </div>
        )}
      </div>

      {/* بخش اینپوت و دکمه اختصاصی متناسب با هر تب */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <form onSubmit={handleCustomPromptSubmit} className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={isLoading}
            placeholder={
              aiTab === 'dayByDay' ? "دستور اصلاح برنامه (مثلاً: روز دوم رو بارونی کن یا جاذبه جدید اضافه کن)..." :
              aiTab === 'packingList' ? "سوال یا مشاوره آزاد (مثلاً: اگر مسافر در ارتفاع بدحال شد چه کنم؟)..." :
              "دستور برای ساخت کپشن (مثلاً: با لحن هیجانی و تخفیف ویژه بنویس)..."
            }
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
<button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 sm:px-4 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            {isLoading ? "در حال تفکر..." : (
              aiTab === 'dayByDay' ? "اصلاح برنامه" :
              aiTab === 'packingList' ? "بپرس از AI" :
              "تولید کپشن"
            )}
          </button>
        </form>
      </div>
{/* فوتر و دکمه‌های اشتراک‌گذاری */}
<div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between flex-wrap gap-3">
  
  {/* آیکون‌ها و شبکه ارتباطی هکیل */}
  <div className="flex items-center gap-2 dir-ltr">

    {/* واتساپ */}
    <a
      href={`https://wa.me/?text=${encodeURIComponent(getShareText())}`}
      target="_blank"
      rel="noopener noreferrer"
      title="واتساپ"
      className="flex items-center gap-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 p-2.5 rounded-xl transition-all shadow-md active:scale-95 border border-emerald-900/50 cursor-pointer"
    >
      <FaWhatsapp size={16} />
    </a>

    {/* تلگرام */}
    <a
      href={`https://t.me/share/url?url=${encodeURIComponent('https://lidera.ir')}&text=${encodeURIComponent(getShareText())}`}
      target="_blank"
      rel="noopener noreferrer"
      title="ارسال به تلگرام"
      className="flex items-center gap-1.5 bg-sky-950/40 hover:bg-sky-900/60 text-sky-400 p-2.5 rounded-xl transition-all shadow-md active:scale-95 border border-sky-900/50 cursor-pointer"
    >
      <FaTelegramPlane size={16} />
    </a>

    {/* روبیکا (فقط کپی متن؛ بدون بستن صفحه) */}
    <button
      type="button"
      onClick={async () => {
        const text = getShareText();
        if (!text) { alert('متنی برای اشتراک‌گذاری وجود ندارد'); return; }
        try {
          await navigator.clipboard.writeText(text);
          alert('✅ متن کپی شد! حالا روبیکا را باز کنید و پیست کنید.');
        } catch {
          alert('❌ کپی انجام نشد. متن را دستی انتخاب و کپی کنید.');
        }
      }}
      title="کپی برای روبیکا"
      className="flex items-center gap-1.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-400 p-2.5 rounded-xl transition-all shadow-md active:scale-95 border border-purple-900/50 cursor-pointer"
    >
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    </button>

    {/* اینستاگرام (کپی متن؛ بدون بستن صفحه) */}
    <button
      type="button"
      onClick={async () => {
        const text = getShareText();
        if (!text) { alert('متنی برای اشتراک‌گذاری وجود ندارد'); return; }
        try {
          await navigator.clipboard.writeText(text);
          alert('✅ متن کپی شد! اینستاگرام را باز کنید و پیست کنید.');
        } catch {
          alert('❌ کپی انجام نشد.');
        }
      }}
      title="کپی برای اینستاگرام"
      className="flex items-center gap-1.5 bg-pink-950/40 hover:bg-pink-900/60 text-pink-400 p-2.5 rounded-xl transition-all shadow-md active:scale-95 border border-pink-900/50 cursor-pointer"
    >
      <FaInstagram size={16} />
    </button>

    {/* اشتراک‌گذاری موبایل (فقط موبایل) */}
    <button
      type="button"
      onClick={async () => {
        const text = getShareText();
        if (!text) { alert('متنی برای اشتراک‌گذاری وجود ندارد'); return; }
        if (typeof navigator !== 'undefined' && navigator.share) {
          try { await navigator.share({ text }); } catch {}
        } else {
          try {
            await navigator.clipboard.writeText(text);
            alert('✅ متن کپی شد! در شبکه اجتماعی دلخواه پیست کنید.');
          } catch {}
        }
      }}
      title="اشتراک‌گذاری"
      className="flex sm:hidden items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-2.5 rounded-xl transition-all shadow-md active:scale-95 border border-zinc-700 cursor-pointer text-xs font-medium"
    >
     
    </button>

        
        </div>
{/* دکمه بستن */}
        <button
          onClick={() => setIsAiModalOpen(false)}
          className="bg-[#F9704E] hover:bg-[#F9704E] text-white hover:text-white  border border-zinc-700/50 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          بستن
        </button>

      </div>

    </div>
  </div>
)}
    </div>
  );
}
