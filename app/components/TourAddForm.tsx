'use client';
import { useState } from 'react';
import { FaMapMarkedAlt } from 'react-icons/fa';

export default function TourAddForm({ onTourCreated }: { onTourCreated: (newTour: any) => void }) {
  const [newTourName, setNewTourName] = useState('');
  const [newTourDuration, setNewTourDuration] = useState('۳ شب و ۴ روز');
  const [newTourStartDate, setNewTourStartDate] = useState('');
  const [newTourEndDate, setNewTourEndDate] = useState('');
  const [newTourPrice, setNewTourPrice] = useState('');
  
  // استیت هتل‌ها و نرخ‌نامه متغیر
  const [newTourHotels, setNewTourHotels] = useState([{ name: '', price: '', desc: '' }]);

  const handleAddHotelRow = () => {
    setNewTourHotels([...newTourHotels, { name: '', price: '', desc: '' }]);
  };

  const handleHotelChange = (index: number, field: string, value: string) => {
    const updated = [...newTourHotels];
    updated[index][field as 'name' | 'price' | 'desc'] = value;
    setNewTourHotels(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTourName.trim();
    if (!trimmed) return;

    const urlParams = new URLSearchParams(window.location.search);
    const currentSlug = urlParams.get('slug');

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
          hotels: newTourHotels.filter(h => h.name.trim() !== ''),
          date: newTourStartDate ? `${newTourStartDate} تا ${newTourEndDate}` : '',    
          price: newTourPrice,   
          images: [] 
        })
      });

      if (res.ok) {
        const createdTour = await res.json();
        alert('✅ تور پیشرفته با نرخ‌نامه هتل‌ها با موفقیت ثبت شد!');
        onTourCreated(createdTour); // اضافه شدن به لیست تورهای داشبورد بدون نیاز به رفرش
        setNewTourName('');
        setNewTourStartDate('');
        setNewTourEndDate('');
        setNewTourPrice('');
        setNewTourHotels([{ name: '', price: '', desc: '' }]);
      } else {
        alert('❌ خطا در ثبت تور');
      }
    } catch (e) {
      console.error(e);
      alert('❌ خطای ارتباط با سرور');
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 text-white" dir="rtl">
      <h2 className="text-md font-bold text-[#F9704E] flex items-center gap-2">
        <FaMapMarkedAlt /> ثبت تور پیشرفته و نرخ‌نامه هتل‌ها
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input 
            type="text" 
            placeholder="عنوان تور (مثلا: تور قشم)" 
            value={newTourName}
            onChange={(e) => setNewTourName(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-[#F9704E]"
            required
          />
          <input 
            type="text" 
            placeholder="مدت اقامت (مثلا: ۳ شب و ۴ روز)" 
            value={newTourDuration}
            onChange={(e) => setNewTourDuration(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-[#F9704E]"
          />
          <input 
            type="text" 
            placeholder="قیمت پایه (تومان)" 
            value={newTourPrice}
            onChange={(e) => setNewTourPrice(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-[#F9704E]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input 
            type="text" 
            placeholder="تاریخ رفت (مثلا: ۴ بهمن)" 
            value={newTourStartDate}
            onChange={(e) => setNewTourStartDate(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-[#F9704E]"
          />
          <input 
            type="text" 
            placeholder="تاریخ برگشت (مثلا: ۸ بهمن)" 
            value={newTourEndDate}
            onChange={(e) => setNewTourEndDate(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-[#F9704E]"
          />
        </div>

        {/* بخش نرخ‌نامه هتل‌ها */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-300">نرخ‌نامه هتل‌های این تور:</span>
            <button 
              type="button" 
              onClick={handleAddHotelRow}
              className="text-xs bg-[#F9704E]/20 text-[#F9704E] px-3 py-1.5 rounded-lg hover:bg-[#F9704E]/30 cursor-pointer"
            >
              + افزودن هتل جدید
            </button>
          </div>

          {newTourHotels.map((hotel, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-black/20 p-3 rounded-xl border border-white/5">
              <input 
                type="text" 
                placeholder="نام هتل (مثلا: پارمیدا)" 
                value={hotel.name}
                onChange={(e) => handleHotelChange(index, 'name', e.target.value)}
                className="bg-black/30 border border-white/10 rounded p-2 text-xs outline-none"
              />
              <input 
                type="number" 
                placeholder="قیمت هر نفر (تومان)" 
                value={hotel.price}
                onChange={(e) => handleHotelChange(index, 'price', e.target.value)}
                className="bg-black/30 border border-white/10 rounded p-2 text-xs outline-none"
              />
              <input 
                type="text" 
                placeholder="توضیحات (مثلا: اتاق ۲ تخته)" 
                value={hotel.desc}
                onChange={(e) => handleHotelChange(index, 'desc', e.target.value)}
                className="bg-black/30 border border-white/10 rounded p-2 text-xs outline-none"
              />
            </div>
          ))}
        </div>

        <button 
          type="submit" 
          className="w-full py-3 bg-[#F9704E] hover:bg-[#e05f3d] text-white font-bold rounded-xl transition-all cursor-pointer"
        >
          ثبت تور و هتل‌ها در سیستم
        </button>
      </form>
    </div>
  );
}