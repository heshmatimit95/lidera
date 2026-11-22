'use client';
import { useState } from 'react';
import { FaMapMarkedAlt, FaPlus, FaTrash } from 'react-icons/fa';

// دکمه‌های «افزودن» یک‌دست و نارنجی (در موبایل عرض کامل و ارتفاع مناسب لمس)
const ADD_BTN_BASE = 'inline-flex items-center justify-center gap-1.5 bg-[#F9704E] hover:bg-[#e05f3d] text-white text-xs font-bold px-4 py-2.5 rounded-xl border-2 border-[#F9704E] cursor-pointer shrink-0 whitespace-nowrap min-h-[40px] active:scale-95 transition-all';
const ADD_BTN = ADD_BTN_BASE + ' w-full sm:w-auto';
const ADD_BTN_INLINE = ADD_BTN_BASE;
// دکمه‌ی حذف ردیف (قابل لمس در موبایل)
const DEL_BTN = 'text-red-400 hover:text-red-300 p-2.5 border border-red-400/50 rounded-lg cursor-pointer shrink-0 flex items-center justify-center';


// گزینه‌های نوع حمل‌ونقل (همین لیست در فرم ویرایش هم استفاده می‌شود)
const TRANSPORT_OPTIONS = [
  'قطار ۴ تخته',
  'قطار ۶ تخته',
  'هواپیما',
  'اتوبوس وی‌آی‌پی',
  'سفر با خودروی شخصی',
];

// انتخاب نوع حمل‌ونقل: لیست کشویی که همیشه همه‌ی گزینه‌ها را نشان می‌دهد + گزینه‌ی «سایر» برای نام دلخواه
function TransportNameField({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const isPreset = TRANSPORT_OPTIONS.includes(value);
  const [custom, setCustom] = useState(false);
  const showCustom = custom || (value !== '' && !isPreset);
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <select
        value={showCustom ? '__custom__' : value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '__custom__') { setCustom(true); if (isPreset) onChange(''); }
          else { setCustom(false); onChange(v); }
        }}
        className={className}
      >
        <option value="" className="bg-white text-black">انتخاب نوع حمل‌ونقل...</option>
        {TRANSPORT_OPTIONS.map((opt) => (
          <option key={opt} value={opt} className="bg-white text-black">{opt}</option>
        ))}
        <option value="__custom__" className="bg-white text-black">سایر (نام دلخواه)</option>
      </select>
      {showCustom && (
        <input
          type="text"
          placeholder="نام دلخواه حمل‌ونقل"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      )}
    </div>
  );
}

// تبدیل اعداد فارسی/عربی به انگلیسی و نگه‌داشتن فقط رقم‌ها
const toEnglishDigits = (str: string) =>
  String(str ?? '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
const onlyDigits = (str: string) => toEnglishDigits(str).replace(/[^0-9]/g, '');

// نمایش مبلغ: ارقام فارسی با جداکننده‌ی سه‌رقمی (مقدار ذخیره‌شده همچنان انگلیسی و بدون جداکننده می‌ماند)
const toFaDigits = (str: string) => str.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
const formatMoney = (value: string) => {
  const digits = onlyDigits(String(value ?? ''));
  return digits ? toFaDigits(digits.replace(/\B(?=(\d{3})+(?!\d))/g, '٬')) : '';
};

export default function TourAddForm({ onTourCreated }: { onTourCreated: (newTour: any) => void }) {
  const [newTourName, setNewTourName] = useState('');
  const [newTourDuration, setNewTourDuration] = useState('۳ شب و ۴ روز');
  const [newTourStartDate, setNewTourStartDate] = useState('');
  const [newTourEndDate, setNewTourEndDate] = useState('');
  const [newTourPrice, setNewTourPrice] = useState('');
  const [newTourCapacity, setNewTourCapacity] = useState(''); // اختیاری: ظرفیت تور (نفر)
  const [isSaving, setIsSaving] = useState(false);

  // 🚆 گزینه‌های حمل‌ونقل (مثل هتل): نام + قیمت هر نفر (اختیاری) + توضیح؛ مسافر یکی را انتخاب می‌کند
  const [newTourTransports, setNewTourTransports] = useState([{ name: 'قطار ۴ تخته', price: '', desc: '' }]);

  const handleAddTransportRow = () => {
    setNewTourTransports([...newTourTransports, { name: '', price: '', desc: '' }]);
  };

  const handleRemoveTransportRow = (index: number) => {
    const updated = newTourTransports.filter((_, i) => i !== index);
    setNewTourTransports(updated.length > 0 ? updated : [{ name: '', price: '', desc: '' }]);
  };

  const handleTransportChange = (index: number, field: string, value: string) => {
    const updated = [...newTourTransports];
    updated[index][field as 'name' | 'price' | 'desc'] = value;
    setNewTourTransports(updated);
  };

  // 🍽️ خدمات سفارشی لیدر (صبحانه، ناهار، گشت و...)
  const [customServices, setCustomServices] = useState<string[]>(['صبحانه', 'بیمه مسافرتی']);
  const [newServiceInput, setNewServiceInput] = useState('');

  // 🏨 هتل‌ها و نرخ‌نامه
  const [newTourHotels, setNewTourHotels] = useState([{ name: '', price: '', desc: '' }]);

  const handleAddHotelRow = () => {
    setNewTourHotels([...newTourHotels, { name: '', price: '', desc: '' }]);
  };

  const handleRemoveHotelRow = (index: number) => {
    const updated = newTourHotels.filter((_, i) => i !== index);
    setNewTourHotels(updated.length > 0 ? updated : [{ name: '', price: '', desc: '' }]);
  };

  const handleHotelChange = (index: number, field: string, value: string) => {
    const updated = [...newTourHotels];
    updated[index][field as 'name' | 'price' | 'desc'] = value;
    setNewTourHotels(updated);
  };

  const handleAddService = () => {
    if (newServiceInput.trim() && !customServices.includes(newServiceInput.trim())) {
      setCustomServices([...customServices, newServiceInput.trim()]);
      setNewServiceInput('');
    }
  };

  const handleRemoveService = (index: number) => {
    setCustomServices(customServices.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const trimmed = newTourName.trim();
    if (!trimmed) return;

    // فقط ردیف‌هایی که نام هتل دارند؛ قیمت هر هتل باید عدد باشد
    const filledHotels = newTourHotels.filter((h) => h.name.trim() !== '');
    for (const h of filledHotels) {
      if (onlyDigits(h.price) === '') {
        alert(`⚠️ قیمت هتل «${h.name.trim()}» را وارد کنید (فقط عدد، به تومان).`);
        return;
      }
    }
    const hotelsPayload = filledHotels.map((h) => ({
      name: h.name.trim(),
      price: onlyDigits(h.price),
      desc: h.desc.trim(),
      description: h.desc.trim(),
    }));

    // گزینه‌های حمل‌ونقل: فقط ردیف‌های دارای نام؛ قیمت اختیاری است (خالی = ۰)
    const transportsPayload = newTourTransports
      .filter((t) => t.name.trim() !== '')
      .map((t) => ({
        name: t.name.trim(),
        price: onlyDigits(t.price) || '0',
        desc: t.desc.trim(),
        description: t.desc.trim(),
      }));

    const urlParams = new URLSearchParams(window.location.search);
    const currentSlug = urlParams.get('slug');

    setIsSaving(true);
    try {
      const res = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentSlug,
          name: trimmed,
          title: trimmed,
          duration: newTourDuration,
          startDate: newTourStartDate,
          endDate: newTourEndDate,
          transportType: transportsPayload[0]?.name || '', // سازگاری با نسخه‌ی قبلی
          transports: transportsPayload, // گزینه‌های حمل‌ونقل قابل انتخاب برای مسافر
          services: customServices, // ارسال خدمات سفارشی
          hotels: hotelsPayload,
          date: newTourStartDate ? `${newTourStartDate} تا ${newTourEndDate}` : '',
          price: onlyDigits(newTourPrice),
          images: []
        })
      });

      if (res.ok) {
        const createdTour = await res.json();
        // ظرفیت اختیاری است؛ فقط اگر لیدر وارد کرده باشد ذخیره می‌شود
        const capNum = Number(onlyDigits(newTourCapacity));
        let capFailed = false;
        if (capNum > 0 && createdTour?.id) {
          try {
            const capRes = await fetch('/api/tours/finance', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tourId: createdTour.id, capacity: capNum }),
            });
            capFailed = !capRes.ok;
          } catch {
            capFailed = true;
          }
        }
        alert('✅ تور پیشرفته با موفقیت ثبت شد!' + (capFailed ? '\n⚠️ ظرفیت ذخیره نشد؛ بعداً از ویرایش تور وارد کنید.' : ''));
        onTourCreated(createdTour);
        setNewTourName('');
        setNewTourStartDate('');
        setNewTourEndDate('');
        setNewTourPrice('');
        setNewTourCapacity('');
        setNewTourHotels([{ name: '', price: '', desc: '' }]);
        setNewTourTransports([{ name: 'قطار ۴ تخته', price: '', desc: '' }]);
      } else {
        const err = await res.json().catch(() => ({}));
        alert('❌ خطا در ثبت تور' + (err?.error || err?.message ? `: ${err.error || err.message}` : ''));
      }
    } catch (e) {
      console.error(e);
      alert('❌ خطای ارتباط با سرور');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/5 border-2 border-[#F9704E]/70 rounded-2xl p-4 sm:p-6 space-y-4 text-white" dir="rtl">
      <h2 className="text-md font-bold text-[#F9704E] flex items-center gap-2">
        <FaMapMarkedAlt /> ثبت تور پیشرفته، حمل‌ونقل و نرخ‌نامه هتل‌ها
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="عنوان تور (مثلا: تور قشم)"
            value={newTourName}
            onChange={(e) => setNewTourName(e.target.value)}
            className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded-xl p-3 text-sm outline-none focus:border-[#F9704E]"
            required
          />
          <input
            type="text"
            placeholder="مدت اقامت (مثلا: ۳ شب و ۴ روز)"
            value={newTourDuration}
            onChange={(e) => setNewTourDuration(e.target.value)}
            className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded-xl p-3 text-sm outline-none focus:border-[#F9704E]"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="قیمت پایه هر نفر (تومان)"
            value={formatMoney(newTourPrice)}
            onChange={(e) => setNewTourPrice(onlyDigits(e.target.value))}
            className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded-xl p-3 text-sm outline-none focus:border-[#F9704E]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="تاریخ رفت (مثلا: ۴ بهمن)"
            value={newTourStartDate}
            onChange={(e) => setNewTourStartDate(e.target.value)}
            className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded-xl p-3 text-sm outline-none focus:border-[#F9704E]"
          />
          <input
            type="text"
            placeholder="تاریخ برگشت (مثلا: ۸ بهمن)"
            value={newTourEndDate}
            onChange={(e) => setNewTourEndDate(e.target.value)}
            className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded-xl p-3 text-sm outline-none focus:border-[#F9704E]"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="ظرفیت تور (نفر) — اختیاری"
            value={toFaDigits(onlyDigits(newTourCapacity))}
            onChange={(e) => setNewTourCapacity(onlyDigits(e.target.value).slice(0, 5))}
            className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded-xl p-3 text-sm outline-none focus:border-[#F9704E]"
          />
        </div>

        {/* 🚆 گزینه‌های حمل‌ونقل (مسافر هنگام ثبت‌نام یکی را انتخاب می‌کند) */}
        <div className="border-t-2 border-[#F9704E]/40 pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="text-xs font-semibold text-gray-300">گزینه‌های حمل‌ونقل (قیمت هر نفر اختیاری است و به قیمت پایه اضافه می‌شود):</span>
            <button
              type="button"
              onClick={handleAddTransportRow}
              className={ADD_BTN}
            >
              <FaPlus size={11} /> افزودن گزینه
            </button>
          </div>

          {newTourTransports.map((tr, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-black/20 p-3 rounded-xl border-2 border-[#F9704E]/40">
              <TransportNameField
                value={tr.name}
                onChange={(v) => handleTransportChange(index, 'name', v)}
                className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded p-2 text-xs outline-none"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="قیمت هر نفر (تومان؛ خالی = ۰)"
                value={formatMoney(tr.price)}
                onChange={(e) => handleTransportChange(index, 'price', onlyDigits(e.target.value))}
                className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded p-2 text-xs outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="توضیحات (مثلا: کوپه ۴ نفره)"
                  value={tr.desc}
                  onChange={(e) => handleTransportChange(index, 'desc', e.target.value)}
                  className="flex-1 min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded p-2 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTransportRow(index)}
                  title="حذف این گزینه"
                  className={DEL_BTN}
                >
                  <FaTrash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 🍽️ بخش خدمات سفارشی تور */}
        <div className="border-t-2 border-[#F9704E]/40 pt-4 space-y-2">
          <label className="text-xs font-semibold text-gray-300">مدیریت خدمات تور (صبحانه، ناهار، ترانسفر و...):</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="افزودن خدمت جدید (مثلا: ناهار سلف سرویس)"
              value={newServiceInput}
              onChange={(e) => setNewServiceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddService();
                }
              }}
              className="flex-1 min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded-xl p-2.5 text-xs outline-none"
            />
            <button
              type="button"
              onClick={handleAddService}
              className={ADD_BTN_INLINE}
            >
              <FaPlus size={11} /> افزودن
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {customServices.map((service, index) => (
              <span key={index} className="bg-black/40 border-2 border-[#F9704E]/60 px-3 py-1 rounded-lg text-xs flex items-center gap-2 text-emerald-400">
                {service}
                <button type="button" onClick={() => handleRemoveService(index)} className="text-red-400 hover:text-red-300">
                  <FaTrash size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* بخش نرخ‌نامه هتل‌ها */}
        <div className="border-t-2 border-[#F9704E]/40 pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="text-xs font-semibold text-gray-300">نرخ‌نامه هتل‌های این تور (قیمت هر نفر، به قیمت پایه اضافه می‌شود):</span>
            <button
              type="button"
              onClick={handleAddHotelRow}
              className={ADD_BTN}
            >
              <FaPlus size={11} /> افزودن هتل جدید
            </button>
          </div>

          {newTourHotels.map((hotel, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-black/20 p-3 rounded-xl border-2 border-[#F9704E]/40">
              <input
                type="text"
                placeholder="نام هتل (مثلا: پارمیدا)"
                value={hotel.name}
                onChange={(e) => handleHotelChange(index, 'name', e.target.value)}
                className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded p-2 text-xs outline-none"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="قیمت هر نفر (تومان)"
                value={formatMoney(hotel.price)}
                onChange={(e) => handleHotelChange(index, 'price', onlyDigits(e.target.value))}
                className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded p-2 text-xs outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="توضیحات (مثلا: اتاق ۲ تخته)"
                  value={hotel.desc}
                  onChange={(e) => handleHotelChange(index, 'desc', e.target.value)}
                  className="flex-1 min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded p-2 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveHotelRow(index)}
                  title="حذف این هتل"
                  className={DEL_BTN}
                >
                  <FaTrash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 bg-[#F9704E] hover:bg-[#e05f3d] disabled:opacity-60 text-white font-bold rounded-xl transition-all cursor-pointer"
        >
          {isSaving ? 'در حال ثبت...' : 'ثبت تور و هتل‌ها در سیستم'}
        </button>
      </form>
    </div>
  );
}