'use client';
import { useState } from 'react';
import { FaMapMarkedAlt, FaPlus, FaTrash } from 'react-icons/fa';

export default function TourAddForm({ onTourCreated }: { onTourCreated: (newTour: any) => void }) {
  const [newTourName, setNewTourName] = useState('');
  const [newTourDuration, setNewTourDuration] = useState('۳ شب و ۴ روز');
  const [newTourStartDate, setNewTourStartDate] = useState('');
  const [newTourEndDate, setNewTourEndDate] = useState('');
  const [newTourPrice, setNewTourPrice] = useState('');
  
  // 🚆 نوع حمل و نقل
  const [transportType, setTransportType] = useState('قطار ۴ تخته');
  
  // 🍽️ خدمات سفارشی لیدر (صبحانه، ناهار، گشت و...)
  const [customServices, setCustomServices] = useState<string[]>(['صبحانه', 'بیمه مسافرتی']);
  const [newServiceInput, setNewServiceInput] = useState('');

  // 🏨 هتل‌ها و نرخ‌نامه
  const [newTourHotels, setNewTourHotels] = useState([{ name: '', price: '', desc: '' }]);

  const handleAddHotelRow = () => {
    setNewTourHotels([...newTourHotels, { name: '', price: '', desc: '' }]);
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
          transportType, // ارسال نوع حمل و نقل
          services: customServices, // ارسال خدمات سفارشی
          hotels: newTourHotels.filter(h => h.name.trim() !== ''),
          date: newTourStartDate ? `${newTourStartDate} تا ${newTourEndDate}` : '',    
          price: newTourPrice,   
          images: [] 
        })
      });

      if (res.ok) {
        const createdTour = await res.json();
        alert('✅ تور پیشرفته با موفقیت ثبت شد!');
        onTourCreated(createdTour);
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
        <FaMapMarkedAlt /> ثبت تور پیشرفته، حمل‌ونقل و نرخ‌نامه هتل‌ها
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          
          {/* 🚆 انتخاب نوع حمل و نقل */}
          <select 
            value={transportType}
            onChange={(e) => setTransportType(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-[#F9704E] text-white"
          >
            <option value="قطار ۴ تخته" className="bg-zinc-900">قطار ۴ تخته</option>
            <option value="قطار ۶ تخته" className="bg-zinc-900">قطار ۶ تخته</option>
            <option value="هواپیما" className="bg-zinc-900">هواپیما</option>
            <option value="اتوبوس وی‌آی‌پی" className="bg-zinc-900">اتوبوس وی‌آی‌پی</option>
            <option value="سفر با خودروی شخصی" className="bg-zinc-900">سفر با خودروی شخصی</option>
          </select>
        </div>

        {/* 🍽️ بخش خدمات سفارشی تور */}
        <div className="border-t border-white/10 pt-4 space-y-2">
          <label className="text-xs font-semibold text-gray-300">مدیریت خدمات تور (صبحانه، ناهار، ترانسفر و...):</label>
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="افزودن خدمت جدید (مثلا: ناهار سلف سرویس)"
              value={newServiceInput}
              onChange={(e) => setNewServiceInput(e.target.value)}
              className="flex-1 bg-black/30 border border-white/10 rounded-xl p-2.5 text-xs outline-none"
            />
            <button 
              type="button"
              onClick={handleAddService}
              className="bg-[#F9704E] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#e05f3d] cursor-pointer flex items-center gap-1"
            >
              <FaPlus /> افزودن
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {customServices.map((service, index) => (
              <span key={index} className="bg-black/40 border border-white/10 px-3 py-1 rounded-lg text-xs flex items-center gap-2 text-emerald-400">
                {service}
                <button type="button" onClick={() => handleRemoveService(index)} className="text-red-400 hover:text-red-300">
                  <FaTrash size={10} />
                </button>
              </span>
            ))}
          </div>
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