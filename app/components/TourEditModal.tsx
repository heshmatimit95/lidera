'use client';
import { useState, useEffect } from 'react';
import { FaEdit, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';

export default function TourEditModal({ tour, isOpen, onClose, onTourUpdated }: { tour: any; isOpen: boolean; onClose: () => void; onTourUpdated: (updated: any) => void }) {
  if (!isOpen || !tour) return null;

  // استفاده از اطلاعات خودِ تور انتخابی به عنوان مقدار اولیه
  const [name, setName] = useState(tour.name || tour.title || '');
  const [duration, setDuration] = useState(tour.duration || '۳ شب و ۴ روز');
  const [startDate, setStartDate] = useState(tour.startDate || '');
  const [endDate, setEndDate] = useState(tour.endDate || '');
  const [price, setPrice] = useState(tour.price || '');
  const [transportType, setTransportType] = useState(tour.transportType || 'قطار ۴ تخته');
  const [services, setServices] = useState<string[]>(tour.services || ['صبحانه', 'بیمه']);
  const [newService, setNewService] = useState('');
  const [hotels, setHotels] = useState(tour.hotels || [{ name: '', price: '', desc: '' }]);
  const handleAddHotel = () => setHotels([...hotels, { name: '', price: '', desc: '' }]);
  const handleHotelChange = (index: number, field: string, value: string) => {
    const updated = [...hotels];
    updated[index][field] = value;
    setHotels(updated);
  };
const handleRemoveHotel = (index: number) => setHotels(hotels.filter((_: any, i: number) => i !== index));

  const handleAddService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService('');
    }
  };
const handleRemoveService = (index: number) => setServices(services.filter((_: any, i: number) => i !== index));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
          price,
          transportType,
          services,
          hotels: hotels.filter((h: any) => h.name.trim() !== ''),
          date: startDate ? `${startDate} تا ${endDate}` : tour.date
        })
      });

      if (res.ok) {
        const updatedData = await res.json();
        alert('✅ تور و اطلاعات هتل‌ها با موفقیت بروزرسانی شد.');
        onTourUpdated(updatedData);
        onClose();
      } else {
        alert('❌ خطا در ویرایش تور');
      }
    } catch (err) {
      console.error(err);
      alert('❌ خطای ارتباط با سرور');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-white" dir="rtl">
      <div className="bg-[#1e1e1e] border border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
          <h3 className="font-bold text-base text-[#F9704E] flex items-center gap-2">
            <FaEdit /> ویرایش کامل تور و نرخ‌نامه هتل‌ها
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer"><FaTimes size={18} /></button>
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
              <label className="text-xs text-zinc-400 block mb-1">قیمت پایه (تومان)</label>
              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-black/30 border border-zinc-700 rounded-xl p-2.5 text-xs outline-none focus:border-[#F9704E]" />
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
                <option value="قطار ۴ تخته" className="bg-zinc-900">قطار ۴ تخته</option>
                <option value="قطار ۶ تخته" className="bg-zinc-900">قطار ۶ تخته</option>
                <option value="هواپیما" className="bg-zinc-900">هواپیما</option>
                <option value="اتوبوس وی‌آی‌پی" className="bg-zinc-900">اتوبوس وی‌آی‌پی</option>
              </select>
            </div>
          </div>

          {/* ویرایش خدمات */}
          <div className="border-t border-zinc-800 pt-3 space-y-2">
            <label className="text-xs text-zinc-400 block">خدمات تور:</label>
            <div className="flex gap-2">
              <input type="text" placeholder="افزودن خدمت..." value={newService} onChange={(e) => setNewService(e.target.value)} className="flex-1 bg-black/30 border border-zinc-700 rounded-xl p-2 text-xs outline-none" />
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
              <label className="text-xs text-zinc-400">نرخ‌نامه هتل‌ها:</label>
              <button type="button" onClick={handleAddHotel} className="text-xs bg-[#F9704E]/20 text-[#F9704E] px-3 py-1 rounded-lg">+ افزودن هتل</button>
            </div>
            {hotels.map((h: any, idx: number) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-black/30 p-2.5 rounded-xl border border-zinc-800">
                <input type="text" placeholder="نام هتل" value={h.name} onChange={(e) => handleHotelChange(idx, 'name', e.target.value)} className="bg-black/40 border border-zinc-700 rounded p-1.5 text-xs outline-none" />
                <input type="number" placeholder="قیمت (تومان)" value={h.price} onChange={(e) => handleHotelChange(idx, 'price', e.target.value)} className="bg-black/40 border border-zinc-700 rounded p-1.5 text-xs outline-none" />
                <div className="flex gap-2">
                  <input type="text" placeholder="توضیحات (اتاق ۲ تخته)" value={h.desc} onChange={(e) => handleHotelChange(idx, 'desc', e.target.value)} className="flex-1 bg-black/40 border border-zinc-700 rounded p-1.5 text-xs outline-none" />
                  <button type="button" onClick={() => handleRemoveHotel(idx)} className="text-red-400 px-2"><FaTrash size={12} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 py-3 bg-[#F9704E] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#e05f3d]">ذخیره تغییرات تور</button>
            <button type="button" onClick={onClose} className="px-4 py-3 bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs cursor-pointer">انصراف</button>
          </div>
        </form>
      </div>
    </div>
  );
}