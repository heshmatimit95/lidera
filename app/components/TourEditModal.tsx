'use client';
import { useState, useEffect } from 'react';
import { FaEdit, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';

// دکمه‌های «افزودن» یک‌دست و نارنجی (در موبایل عرض کامل و ارتفاع مناسب لمس)
const ADD_BTN_BASE = 'inline-flex items-center justify-center gap-1.5 bg-[#F9704E] hover:bg-[#e05f3d] text-white text-xs font-bold px-4 py-2.5 rounded-xl border-2 border-[#F9704E] cursor-pointer shrink-0 whitespace-nowrap min-h-[40px] active:scale-95 transition-all';
const ADD_BTN = ADD_BTN_BASE + ' w-full sm:w-auto';
const ADD_BTN_INLINE = ADD_BTN_BASE;
// دکمه‌ی حذف ردیف (قابل لمس در موبایل)
const DEL_BTN = 'text-red-400 hover:text-red-300 p-2.5 border border-red-400/50 rounded-lg cursor-pointer shrink-0 flex items-center justify-center';


// گزینه‌های نوع حمل‌ونقل (همان لیست فرم ثبت تور)
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

type HotelRow = { id?: string; name: string; price: string; desc: string };
type TransportRow = { id?: string; name: string; price: string; desc: string };

// تبدیل هتل‌های دیتابیس (name, price, description) به ردیف‌های فرم
const mapHotelsToRows = (hotels: any): HotelRow[] => {
  if (!Array.isArray(hotels) || hotels.length === 0) return [{ name: '', price: '', desc: '' }];
  return hotels.map((h: any) => ({
    id: h.id,
    name: h.name || '',
    price: h.price !== undefined && h.price !== null ? String(h.price) : '',
    desc: h.description ?? h.desc ?? '',
  }));
};

// تبدیل گزینه‌های حمل‌ونقل تور به ردیف‌های فرم؛ تورهای قدیمی (فقط transportType) به یک گزینه تبدیل می‌شوند
const mapTransportsToRows = (tour: any): TransportRow[] => {
  if (Array.isArray(tour?.transports) && tour.transports.length > 0) {
    return tour.transports.map((t: any) => ({
      id: t.id,
      name: t.name || '',
      price: t.price !== undefined && t.price !== null && Number(t.price) > 0 ? String(t.price) : '',
      desc: t.description ?? t.desc ?? '',
    }));
  }
  if (tour?.transportType) return [{ name: String(tour.transportType), price: '', desc: '' }];
  return [{ name: '', price: '', desc: '' }];
};

export default function TourEditModal({ tour, isOpen, onClose, onTourUpdated }: { tour: any; isOpen: boolean; onClose: () => void; onTourUpdated: (updated: any) => void }) {
  // ⚠️ همه‌ی Hookها باید قبل از هر return شرطی باشند (قبلاً return قبل از useState بود و باز شدن مودال خطای React می‌داد)
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('۳ شب و ۴ روز');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [price, setPrice] = useState('');
  const [transports, setTransports] = useState<TransportRow[]>([{ name: '', price: '', desc: '' }]);
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  const [hotels, setHotels] = useState<HotelRow[]>([{ name: '', price: '', desc: '' }]);
  const [isSaving, setIsSaving] = useState(false);

  // هر بار که مودال برای یک تور باز می‌شود، فرم با اطلاعات همان تور پر می‌شود
  useEffect(() => {
    if (!isOpen || !tour) return;
    setName(tour.name || tour.title || '');
    setDuration(tour.duration || '۳ شب و ۴ روز');
    setStartDate(tour.startDate || '');
    setEndDate(tour.endDate || '');
    setPrice(tour.price ? String(tour.price) : '');
    setTransports(mapTransportsToRows(tour));
    setServices(Array.isArray(tour.services) ? tour.services : []);
    setNewService('');
    setHotels(mapHotelsToRows(tour.hotels));
  }, [tour, isOpen]);

  if (!isOpen || !tour) return null;

  const handleAddHotel = () => setHotels([...hotels, { name: '', price: '', desc: '' }]);

  const handleHotelChange = (index: number, field: 'name' | 'price' | 'desc', value: string) => {
    const updated = [...hotels];
    updated[index] = { ...updated[index], [field]: value };
    setHotels(updated);
  };

  const handleRemoveHotel = (index: number) => {
    const updated = hotels.filter((_, i) => i !== index);
    setHotels(updated.length > 0 ? updated : [{ name: '', price: '', desc: '' }]);
  };

  const handleAddTransport = () => setTransports([...transports, { name: '', price: '', desc: '' }]);

  const handleTransportChange = (index: number, field: 'name' | 'price' | 'desc', value: string) => {
    const updated = [...transports];
    updated[index] = { ...updated[index], [field]: value };
    setTransports(updated);
  };

  const handleRemoveTransport = (index: number) => {
    const updated = transports.filter((_, i) => i !== index);
    setTransports(updated.length > 0 ? updated : [{ name: '', price: '', desc: '' }]);
  };

  const handleAddService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService('');
    }
  };

  const handleRemoveService = (index: number) => setServices(services.filter((_, i) => i !== index));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    // فقط ردیف‌هایی که نام هتل دارند؛ قیمت هر هتل باید عدد باشد
    const filledHotels = hotels.filter((h) => h.name.trim() !== '');
    for (const h of filledHotels) {
      if (onlyDigits(h.price) === '') {
        alert(`⚠️ قیمت هتل «${h.name.trim()}» را وارد کنید (فقط عدد، به تومان).`);
        return;
      }
    }

    // گزینه‌های حمل‌ونقل: فقط ردیف‌های دارای نام؛ قیمت اختیاری است (خالی = ۰)
    const transportsPayload = transports
      .filter((t) => t.name.trim() !== '')
      .map((t) => ({
        id: t.id,
        name: t.name.trim(),
        price: onlyDigits(t.price) || '0',
        desc: t.desc.trim(),
        description: t.desc.trim(),
      }));

    setIsSaving(true);
    try {
      const res = await fetch('/api/tours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tour.id,
          name,
          title: name,
          duration,
          startDate,
          endDate,
          price: onlyDigits(price),
          transportType: transportsPayload[0]?.name || '',
          transports: transportsPayload,
          services,
          hotels: filledHotels.map((h) => ({
            id: h.id,
            name: h.name.trim(),
            price: onlyDigits(h.price),
            desc: h.desc.trim(),
            description: h.desc.trim(),
          })),
          date: startDate ? `${startDate} تا ${endDate}` : tour.date
        })
      });

      if (res.ok) {
        const updatedData = await res.json();
        alert('✅ تور و اطلاعات هتل‌ها با موفقیت بروزرسانی شد.');
        onTourUpdated(updatedData);
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('❌ خطا در ویرایش تور' + (err?.error || err?.message ? `: ${err.error || err.message}` : ''));
      }
    } catch (err) {
      console.error(err);
      alert('❌ خطای ارتباط با سرور');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-white" dir="rtl">
      <div className="bg-[#1e1e1e] border-2 border-[#F9704E]/70 w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex justify-between items-center pb-3 border-b-2 border-[#F9704E]/40">
          <h3 className="font-bold text-base text-[#F9704E] flex items-center gap-2">
            <FaEdit /> ویرایش کامل تور و نرخ‌نامه هتل‌ها
          </h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer"><FaTimes size={18} /></button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">عنوان تور</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded-xl p-2.5 text-xs outline-none focus:border-[#F9704E]" required />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">مدت اقامت</label>
              <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded-xl p-2.5 text-xs outline-none focus:border-[#F9704E]" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">قیمت پایه هر نفر (تومان)</label>
              <input type="text" inputMode="numeric" value={formatMoney(price)} onChange={(e) => setPrice(onlyDigits(e.target.value))} className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded-xl p-2.5 text-xs outline-none focus:border-[#F9704E]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">تاریخ رفت</label>
              <input type="text" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded-xl p-2.5 text-xs outline-none focus:border-[#F9704E]" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">تاریخ برگشت</label>
              <input type="text" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded-xl p-2.5 text-xs outline-none focus:border-[#F9704E]" />
            </div>
          </div>

          {/* ویرایش گزینه‌های حمل‌ونقل (مسافر یکی را انتخاب می‌کند) */}
          <div className="border-t-2 border-[#F9704E]/40 pt-3 space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <label className="text-xs text-zinc-400">گزینه‌های حمل‌ونقل (قیمت هر نفر اختیاری است و به قیمت پایه اضافه می‌شود):</label>
              <button type="button" onClick={handleAddTransport} className={ADD_BTN}><FaPlus size={11} /> افزودن گزینه</button>
            </div>
            {transports.map((t, idx) => (
              <div key={t.id || idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-black/30 p-2.5 rounded-xl border-2 border-[#F9704E]/40">
                <TransportNameField value={t.name} onChange={(v) => handleTransportChange(idx, 'name', v)} className="w-full min-w-0 bg-black/40 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded p-1.5 text-xs outline-none" />
                <input type="text" inputMode="numeric" placeholder="قیمت هر نفر (تومان؛ خالی = ۰)" value={formatMoney(t.price)} onChange={(e) => handleTransportChange(idx, 'price', onlyDigits(e.target.value))} className="w-full min-w-0 bg-black/40 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded p-1.5 text-xs outline-none" />
                <div className="flex gap-2">
                  <input type="text" placeholder="توضیحات (کوپه ۴ نفره)" value={t.desc} onChange={(e) => handleTransportChange(idx, 'desc', e.target.value)} className="flex-1 min-w-0 bg-black/40 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded p-1.5 text-xs outline-none" />
                  <button type="button" onClick={() => handleRemoveTransport(idx)} title="حذف این گزینه" className={DEL_BTN}><FaTrash size={12} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* ویرایش خدمات */}
          <div className="border-t-2 border-[#F9704E]/40 pt-3 space-y-2">
            <label className="text-xs text-zinc-400 block">خدمات تور:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="افزودن خدمت..."
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddService();
                  }
                }}
                className="flex-1 min-w-0 bg-black/30 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded-xl p-2 text-xs outline-none"
              />
              <button type="button" onClick={handleAddService} className={ADD_BTN_INLINE}><FaPlus size={11} /> افزودن</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {services.map((s, idx) => (
                <span key={idx} className="bg-black/40 border-2 border-[#F9704E]/60 px-2.5 py-1 rounded-lg text-xs flex items-center gap-2 text-emerald-400">
                  {s} <button type="button" onClick={() => handleRemoveService(idx)} className="text-red-400"><FaTrash size={10} /></button>
                </span>
              ))}
            </div>
          </div>

          {/* ویرایش هتل‌ها */}
          <div className="border-t-2 border-[#F9704E]/40 pt-3 space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <label className="text-xs text-zinc-400">نرخ‌نامه هتل‌ها (قیمت هر نفر، به قیمت پایه اضافه می‌شود):</label>
              <button type="button" onClick={handleAddHotel} className={ADD_BTN}><FaPlus size={11} /> افزودن هتل</button>
            </div>
            {hotels.map((h, idx) => (
              <div key={h.id || idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-black/30 p-2.5 rounded-xl border-2 border-[#F9704E]/40">
                <input type="text" placeholder="نام هتل" value={h.name} onChange={(e) => handleHotelChange(idx, 'name', e.target.value)} className="w-full min-w-0 bg-black/40 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded p-1.5 text-xs outline-none" />
                <input type="text" inputMode="numeric" placeholder="قیمت هر نفر (تومان)" value={formatMoney(h.price)} onChange={(e) => handleHotelChange(idx, 'price', onlyDigits(e.target.value))} className="w-full min-w-0 bg-black/40 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded p-1.5 text-xs outline-none" />
                <div className="flex gap-2">
                  <input type="text" placeholder="توضیحات (اتاق ۲ تخته)" value={h.desc} onChange={(e) => handleHotelChange(idx, 'desc', e.target.value)} className="flex-1 min-w-0 bg-black/40 border-2 border-[#F9704E]/80 focus:ring-2 focus:ring-[#F9704E]/30 rounded p-1.5 text-xs outline-none" />
                  <button type="button" onClick={() => handleRemoveHotel(idx)} title="حذف این هتل" className={DEL_BTN}><FaTrash size={12} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-[#F9704E] disabled:opacity-60 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#e05f3d]">
              {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات تور'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-3 bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs cursor-pointer">انصراف</button>
          </div>
        </form>
      </div>
    </div>
  );
}