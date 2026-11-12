'use client';
import { useState, useEffect } from 'react';
import { FaEdit, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';

// گزینه‌های نوع حمل‌ونقل (همان لیست فرم ثبت تور)
const TRANSPORT_OPTIONS = [
  'قطار ۴ تخته',
  'قطار ۶ تخته',
  'هواپیما',
  'اتوبوس وی‌آی‌پی',
  'سفر با خودروی شخصی',
];

const toEnglishDigits = (str: string) =>
  String(str ?? '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
const onlyDigits = (str: string) => toEnglishDigits(str).replace(/[^0-9]/g, '');

type HotelRow = { id?: string; name: string; price: string; desc: string };

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

export default function TourEditModal({ tour, isOpen, onClose, onTourUpdated }: { tour: any; isOpen: boolean; onClose: () => void; onTourUpdated: (updated: any) => void }) {
  // ⚠️ همه‌ی Hookها باید قبل از هر return شرطی باشند (قبلاً return قبل از useState بود و باز شدن مودال خطای React می‌داد)
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('۳ شب و ۴ روز');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [price, setPrice] = useState('');
  const [transportType, setTransportType] = useState('قطار ۴ تخته');
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
    setTransportType(tour.transportType || 'قطار ۴ تخته');
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
          transportType,
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

  // اگر نوع حمل‌ونقل ذخیره‌شده در لیست استاندارد نبود، همان هم نمایش داده می‌شود
  const transportOptions = TRANSPORT_OPTIONS.includes(transportType) ? TRANSPORT_OPTIONS : [transportType, ...TRANSPORT_OPTIONS];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-white" dir="rtl">
      <div className="bg-[#1e1e1e] border border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
          <h3 className="font-bold text-base text-[#F9704E] flex items-center gap-2">
            <FaEdit /> ویرایش کامل تور و نرخ‌نامه هتل‌ها
          </h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer"><FaTimes size={18} /></button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">عنوان تور</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/30 border border-zinc-700 rounded-xl p-2.5 text-xs outline-none focus:border-[#F9704E]" required />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">مدت اقامت</label>
              <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-black/30 border border-zinc-700 rounded-xl p-2.5 text-xs outline-none focus:border-[#F9704E]" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">قیمت پایه هر نفر (تومان)</label>
              <input type="text" inputMode="numeric" value={price} onChange={(e) => setPrice(onlyDigits(e.target.value))} className="w-full bg-black/30 border border-zinc-700 rounded-xl p-2.5 text-xs outline-none focus:border-[#F9704E]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">تاریخ رفت</label>
              <input type="text" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-black/30 border border-zinc-700 rounded-xl p-2.5 text-xs outline-none focus:border-[#F9704E]" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">تاریخ برگشت</label>
              <input type="text" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-black/30 border border-zinc-700 rounded-xl p-2.5 text-xs outline-none focus:border-[#F9704E]" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">نوع حمل‌ونقل</label>
              <select value={transportType} onChange={(e) => setTransportType(e.target.value)} className="w-full bg-black/30 border border-zinc-700 rounded-xl p-2.5 text-xs outline-none focus:border-[#F9704E] text-white">
                {transportOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ویرایش خدمات */}
          <div className="border-t border-zinc-800 pt-3 space-y-2">
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
                className="flex-1 bg-black/30 border border-zinc-700 rounded-xl p-2 text-xs outline-none"
              />
              <button type="button" onClick={handleAddService} className="bg-[#F9704E] px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"><FaPlus /></button>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {services.map((s, idx) => (
                <span key={idx} className="bg-black/40 border border-zinc-700 px-2.5 py-1 rounded-lg text-xs flex items-center gap-2 text-emerald-400">
                  {s} <button type="button" onClick={() => handleRemoveService(idx)} className="text-red-400"><FaTrash size={10} /></button>
                </span>
              ))}
            </div>
          </div>

          {/* ویرایش هتل‌ها */}
          <div className="border-t border-zinc-800 pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs text-zinc-400">نرخ‌نامه هتل‌ها (قیمت هر نفر، به قیمت پایه اضافه می‌شود):</label>
              <button type="button" onClick={handleAddHotel} className="text-xs bg-[#F9704E]/20 text-[#F9704E] px-3 py-1 rounded-lg cursor-pointer">+ افزودن هتل</button>
            </div>
            {hotels.map((h, idx) => (
              <div key={h.id || idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-black/30 p-2.5 rounded-xl border border-zinc-800">
                <input type="text" placeholder="نام هتل" value={h.name} onChange={(e) => handleHotelChange(idx, 'name', e.target.value)} className="bg-black/40 border border-zinc-700 rounded p-1.5 text-xs outline-none" />
                <input type="text" inputMode="numeric" placeholder="قیمت هر نفر (تومان)" value={h.price} onChange={(e) => handleHotelChange(idx, 'price', onlyDigits(e.target.value))} className="bg-black/40 border border-zinc-700 rounded p-1.5 text-xs outline-none" />
                <div className="flex gap-2">
                  <input type="text" placeholder="توضیحات (اتاق ۲ تخته)" value={h.desc} onChange={(e) => handleHotelChange(idx, 'desc', e.target.value)} className="flex-1 bg-black/40 border border-zinc-700 rounded p-1.5 text-xs outline-none" />
                  <button type="button" onClick={() => handleRemoveHotel(idx)} title="حذف این هتل" className="text-red-400 px-2 cursor-pointer"><FaTrash size={12} /></button>
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
