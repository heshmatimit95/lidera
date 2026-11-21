'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaTimes, FaChartLine, FaCopy, FaChevronDown } from 'react-icons/fa';

// ───────── ابزارها ─────────
const toEn = (s: any) =>
  String(s ?? '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
const num = (v: any) => {
  const d = toEn(v).replace(/[^0-9]/g, '');
  return d ? Number(d) : 0;
};
const fa = (n: number) => Math.round(Number.isFinite(n) ? n : 0).toLocaleString('fa-IR');
const money = (n: number) => fa(n) + ' تومان';
const pct = (n: number) => fa(Math.max(0, Math.min(100, n))) + '٪';

type Kind = 'paid' | 'deposit' | 'receipt' | 'waiting' | 'rejected';
const kindOf = (s?: string): Kind => {
  const v = String(s || '');
  if (v === 'پرداخت شده') return 'paid';
  if (v === 'بیعانه') return 'deposit';
  if (v.includes('مغایرت') || v.includes('فیش رد') || v === 'رد شده') return 'rejected';
  if (v.includes('تایید فیش')) return 'receipt';
  return 'waiting';
};

const seatsOf = (p: any) => Math.max(1, Number(p?.seatsCount ?? p?.seats ?? 1) || 1);

const belongs = (p: any, t: any) =>
  (!!p.tourId && !!t.id && p.tourId === t.id) ||
  (!!t.name && String(p.tourName || '').trim().startsWith(String(t.name).trim()));

// ورودی مبلغ با جداکننده‌ی سه‌رقمی فارسی (مقدار ذخیره‌شده: رقم انگلیسی)
function MoneyField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-zinc-300">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={value ? fa(num(value)) : ''}
        onChange={(e) => onChange(toEn(e.target.value).replace(/[^0-9]/g, ''))}
        placeholder="۰"
        className="w-full min-w-0 rounded-xl border-2 border-[#F9704E]/80 bg-black/40 p-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-[#F9704E]/30"
      />
      {hint && <span className="mt-1 block text-[10px] text-zinc-500">{hint}</span>}
    </label>
  );
}

function Bar({ label, sub, value, max }: { label: string; sub: string; value: number; max: number }) {
  const w = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px]">
        <span className="min-w-0 truncate font-bold text-white">{label}</span>
        <span className="shrink-0 text-zinc-400">{sub}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#F9704E]" style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'green' | 'amber' | 'orange' | 'red' | 'plain' }) {
  const color =
    tone === 'green' ? 'text-emerald-400' : tone === 'amber' ? 'text-amber-300' : tone === 'red' ? 'text-rose-400' : tone === 'orange' ? 'text-[#F9704E]' : 'text-white';
  return (
    <div className="min-w-0 rounded-2xl border-2 border-[#F9704E]/50 bg-[#1a1a1e] p-3">
      <div className="text-[11px] text-zinc-400">{label}</div>
      <div className={`mt-1 truncate text-sm font-extrabold sm:text-base ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-zinc-500">{sub}</div>}
    </div>
  );
}


// بخش کشویی (آکاردئونی): هر لحظه یک بخش باز است تا در موبایل صفحه بلند نشود
function Section({ id, title, preview, openId, setOpenId, children }: { id: string; title: string; preview?: string; openId: string; setOpenId: (v: string) => void; children: React.ReactNode }) {
  const isOpen = openId === id;
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-[#F9704E]/60 bg-[#1a1a1e]">
      <button
        type="button"
        onClick={() => setOpenId(isOpen ? '' : id)}
        aria-expanded={isOpen}
        className="flex min-h-48px w-full cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-right"
      >
        <span className="min-w-0 text-xs font-extrabold text-white sm:text-sm">{title}</span>
        <span className="flex shrink-0 items-center gap-2">
          {!isOpen && preview && <span className="max-w-140px truncate text-[11px] font-bold text-[#F9704E]">{preview}</span>}
          <FaChevronDown size={12} className={`text-[#F9704E] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {isOpen && <div className="border-t border-white/10 p-3">{children}</div>}
    </div>
  );
}

export default function TourFinancePanel({
  tours,
  passengers,
  onClose,
}: {
  tours: any[];
  passengers: any[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string>('all');
  const [openId, setOpenId] = useState<string>('summary');
  const tour = useMemo(() => (selected === 'all' ? null : (tours || []).find((t: any) => (t.id || t.name) === selected) || null), [selected, tours]);
  const tourId: string = tour?.id || '';

  // ظرفیت و هزینه‌ها: در دیتابیس (برای هر تور) ذخیره می‌شود و از هر دستگاهی در دسترس است
  const [capacity, setCapacity] = useState('');
  const [fixedCost, setFixedCost] = useState('');
  const [perPerson, setPerPerson] = useState('');
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dirty = useRef(false);

  // بارگذاری از سرور هنگام انتخاب تور
  useEffect(() => {
    setReady(false);
    dirty.current = false;
    setSaveState('idle');
    setCapacity(''); setFixedCost(''); setPerPerson('');
    if (!tourId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/tours/finance?tourId=${encodeURIComponent(tourId)}`, { cache: 'no-store' });
        const d = res.ok ? await res.json() : {};
        if (!alive) return;
        let c = Number(d.capacity) || 0, fx = Number(d.fixedCost) || 0, pp = Number(d.perPerson) || 0;
        // انتقال یک‌باره‌ی مقادیر قدیمیِ ذخیره‌شده در مرورگر (اگر سرور خالی است)
        if (!c && !fx && !pp) {
          try {
            const old = JSON.parse(localStorage.getItem(`lidera-fin:${tourId}`) || '{}');
            c = num(old.capacity); fx = num(old.fixedCost); pp = num(old.perPerson);
            if (c || fx || pp) dirty.current = true;
          } catch {}
        }
        setCapacity(c ? String(c) : ''); setFixedCost(fx ? String(fx) : ''); setPerPerson(pp ? String(pp) : '');
      } catch {
        if (alive) setSaveState('error');
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, [tourId]);

  // ذخیره‌ی خودکار (۸۰۰ میلی‌ثانیه بعد از آخرین تغییر)
  useEffect(() => {
    if (!ready || !tourId || !dirty.current) return;
    setSaveState('saving');
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/tours/finance', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tourId, capacity: num(capacity), fixedCost: num(fixedCost), perPerson: num(perPerson) }),
        });
        if (res.ok) {
          setSaveState('saved');
          try { localStorage.removeItem(`lidera-fin:${tourId}`); } catch {}
        } else setSaveState('error');
      } catch { setSaveState('error'); }
    }, 800);
    return () => clearTimeout(t);
  }, [ready, tourId, capacity, fixedCost, perPerson]);

  const edit = (setter: (v: string) => void) => (v: string) => { dirty.current = true; setter(v); };

  const list = useMemo(() => {
    const all = Array.isArray(passengers) ? passengers : [];
    return tour ? all.filter((p: any) => belongs(p, tour)) : all;
  }, [passengers, tour]);

  const f = useMemo(() => {
    const acc = {
      regs: 0, seats: 0, revenue: 0,
      paid: 0, deposit: 0, receipt: 0, waiting: 0, rejected: 0,
      rejectedCount: 0, receiptCount: 0, depositCount: 0, staleCount: 0,
    };
    const hotels: Record<string, { seats: number; revenue: number }> = {};
    const transports: Record<string, { seats: number; revenue: number }> = {};
    const days: Record<string, number> = {};
    const now = Date.now();

    for (const p of list) {
      const k = kindOf(p.originalPaymentStatus || p.paymentStatus); // وضعیت ذخیره‌شده، نه تغییر ذخیره‌نشده‌ی جدول
      const amount = num(p.amount);
      const seats = seatsOf(p);
      if (k === 'rejected') {
        acc.rejected += amount;
        acc.rejectedCount += 1;
        continue;
      }
      acc.regs += 1;
      acc.seats += seats;
      acc.revenue += amount;
      if (k === 'paid') acc.paid += amount;
      if (k === 'deposit') { acc.deposit += amount; acc.depositCount += 1; }
      if (k === 'receipt') { acc.receipt += amount; acc.receiptCount += 1; }
      if (k === 'waiting') acc.waiting += amount;
      if ((k === 'waiting' || k === 'receipt') && p.createdAt) {
        const age = now - new Date(p.createdAt).getTime();
        if (age > 3 * 24 * 3600 * 1000) acc.staleCount += 1;
      }
      const h = String(p.hotelName || 'بدون هتل');
      const t = String(p.transportName || 'بدون انتخاب حمل‌ونقل');
      (hotels[h] ||= { seats: 0, revenue: 0 });
      hotels[h].seats += seats; hotels[h].revenue += amount;
      (transports[t] ||= { seats: 0, revenue: 0 });
      transports[t].seats += seats; transports[t].revenue += amount;
      if (p.createdAt) {
        const d = new Date(p.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        days[key] = (days[key] || 0) + 1;
      }
    }
    return { ...acc, hotels, transports, days };
  }, [list]);

  const trend = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (13 - i));
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      return { d, count: f.days[key] || 0 };
    });
  }, [f.days]);
  const trendMax = Math.max(1, ...trend.map((x) => x.count));

  // ───────── محاسبه‌ی سود و سربه‌سر ─────────
  const cap = num(capacity);
  const fixed = num(fixedCost);
  const per = num(perPerson);
  const avgPerSeat = f.seats > 0 ? f.revenue / f.seats : 0;
  const totalCost = fixed + per * f.seats;
  const expectedProfit = f.revenue - totalCost;
  const cashProfit = f.paid - totalCost;
  const margin = f.revenue > 0 ? (expectedProfit / f.revenue) * 100 : 0;
  const contribution = avgPerSeat - per;
  const breakEven = contribution > 0 ? Math.ceil(fixed / contribution) : null;
  const remaining = cap > 0 ? cap - f.seats : null;
  const fillPct = cap > 0 ? (f.seats / cap) * 100 : 0;
  const profitAtCap = cap > 0 ? avgPerSeat * cap - (fixed + per * cap) : null;
  const collectPct = f.revenue > 0 ? (f.paid / f.revenue) * 100 : 0;
  const hasCosts = fixed > 0 || per > 0;
  const needTour = selected === 'all';

  // نتیجه‌گیری ساده
  const insights: { tone: 'good' | 'warn' | 'bad'; text: string }[] = [];
  if (f.receiptCount > 0) insights.push({ tone: 'warn', text: `${fa(f.receiptCount)} فیش منتظر تأیید شماست.` });
  if (f.staleCount > 0) insights.push({ tone: 'warn', text: `${fa(f.staleCount)} ثبت‌نام بیش از ۳ روز است معوق مانده؛ پیگیری کنید.` });
  if (f.depositCount > 0) insights.push({ tone: 'warn', text: `${fa(f.depositCount)} نفر فقط بیعانه داده‌اند (باقی‌مانده را پیگیری کنید).` });
  if (f.revenue > 0 && collectPct < 50) insights.push({ tone: 'bad', text: 'کمتر از نیمی از مبلغ ثبت‌شده وصول شده است.' });
  if (!needTour && hasCosts && f.seats > 0) {
    if (expectedProfit < 0) insights.push({ tone: 'bad', text: `با هزینه‌های واردشده، تور فعلاً ${money(-expectedProfit)} زیان‌ده است.` });
    else insights.push({ tone: 'good', text: `سود پیش‌بینی‌شده‌ی فعلی: ${money(expectedProfit)} (حاشیه‌ی سود ${fa(margin)}٪).` });
  }
  if (breakEven !== null && fixed > 0 && f.seats < breakEven) insights.push({ tone: 'warn', text: `برای سربه‌سر شدن ${fa(breakEven - f.seats)} نفر دیگر لازم است.` });
  if (remaining !== null && remaining <= Math.ceil(cap * 0.2) && remaining >= 0) insights.push({ tone: 'good', text: `فقط ${fa(remaining)} صندلی خالی مانده؛ زمان خوبی برای تبلیغ «آخرین ظرفیت» است.` });
  if (remaining !== null && remaining < 0) insights.push({ tone: 'bad', text: `ثبت‌نام‌ها ${fa(-remaining)} نفر از ظرفیت بیشتر است.` });

  const maxHotel = Math.max(0, ...Object.values(f.hotels).map((x) => x.revenue));
  const maxTransport = Math.max(0, ...Object.values(f.transports).map((x) => x.revenue));

  const summaryText = () => {
    const lines = [
      `📊 گزارش مالی ${tour ? tour.name : 'همه‌ی تورها'}`,
      `ثبت‌نام: ${fa(f.regs)} (${fa(f.seats)} نفر)`,
      `جمع مبلغ ثبت‌شده: ${money(f.revenue)}`,
      `وصول‌شده: ${money(f.paid)} (${pct(collectPct)})`,
      `بیعانه: ${money(f.deposit)}`,
      `در انتظار پرداخت/تأیید: ${money(f.waiting + f.receipt)}`,
    ];
    if (!needTour && hasCosts) {
      lines.push(`هزینه‌ی کل: ${money(totalCost)}`);
      lines.push(`سود پیش‌بینی‌شده: ${money(expectedProfit)}`);
    }
    return lines.join('\n');
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const toneCls = (t: string) =>
    t === 'good' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : t === 'bad' ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-200';
  const saveLabel = saveState === 'saving' ? 'در حال ذخیره…' : saveState === 'saved' ? 'ذخیره شد ✓' : saveState === 'error' ? 'ذخیره نشد؛ اینترنت را بررسی کنید' : 'ذخیره‌ی خودکار در حساب شما';
  const saveCls = saveState === 'error' ? 'text-rose-400' : saveState === 'saved' ? 'text-emerald-400' : 'text-zinc-500';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4" dir="rtl" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col rounded-t-2xl border-2 border-[#E5C060] bg-[#F9704E] text-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl">
        {/* سربرگ ثابت */}
        <div className="shrink-0 border-b-2 border-[#F9704E]/40 px-4 pb-3 pt-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#F9704E] sm:text-base">
              <FaChartLine /> تحلیل مالی تور
            </h3>
            <button type="button" onClick={onClose} className="cursor-pointer p-1 text-zinc-100 hover:text-white" aria-label="بستن">
              <FaTimes size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={selected}
              onChange={(e) => { setSelected(e.target.value); setOpenId('summary'); }}
              className="min-w-0 flex-1 rounded-xl border-2 border-[#F9704E]/80 bg-black/40 p-2.5 text-base text-white outline-none sm:text-xs"
            >
              <option value="all" className="bg-black text-white">همه‌ی تورها</option>
              {(tours || []).map((t: any) => (
                <option key={t.id || t.name} value={t.id || t.name} className="bg-white text-black">{t.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={copySummary}
              className="inline-flex min-h-40px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 border-[#F9704E] bg-[#F9704E]/15 px-4 py-2 text-xs font-bold text-[#F9704E] hover:bg-[#F9704E]/25 sm:w-auto"
            >
              <FaCopy size={11} /> {copied ? 'کپی شد ✓' : 'کپی خلاصه‌ی گزارش'}
            </button>
          </div>
        </div>

        {/* بدنه‌ی اسکرول‌شونده با بخش‌های کشویی */}
        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6">
          <Section id="summary" title="خلاصه‌ی وضعیت" preview={`وصول ${pct(collectPct)}`} openId={openId} setOpenId={setOpenId}>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <Kpi label="ثبت‌نام (به‌جز ردشده‌ها)" value={`${fa(f.regs)} ثبت‌نام / ${fa(f.seats)} نفر`} tone="orange" />
              <Kpi label="جمع مبلغ ثبت‌شده" value={money(f.revenue)} />
              <Kpi label="وصول‌شده (پرداخت‌شده)" value={money(f.paid)} sub={`${pct(collectPct)} از کل`} tone="green" />
              <Kpi label="بیعانه" value={money(f.deposit)} sub={`${fa(f.depositCount)} نفر`} tone="amber" />
              <Kpi label="در انتظار پرداخت یا تأیید" value={money(f.waiting + f.receipt)} sub={`${fa(f.receiptCount)} فیش منتظر تأیید`} tone="amber" />
              <Kpi label="ردشده / مغایرت" value={money(f.rejected)} sub={`${fa(f.rejectedCount)} مورد (در جمع نیست)`} tone="red" />
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="mb-1.5 flex justify-between text-[11px] text-zinc-100">
                <span>درصد وصول مبلغ</span>
                <span className="font-bold text-emerald-400">{pct(collectPct)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, collectPct)}%` }} />
              </div>
            </div>
          </Section>

          <Section id="alerts" title="هشدارها و پیشنهادها" preview={insights.length ? `${fa(insights.length)} مورد` : 'موردی نیست'} openId={openId} setOpenId={setOpenId}>
            {insights.length === 0 ? (
              <p className="text-[11px] leading-6 text-zinc-100">فعلاً موردی که نیاز به پیگیری باشد نیست.</p>
            ) : (
              <div className="space-y-2">
                {insights.map((x, i) => (
                  <div key={i} className={`rounded-xl border px-3 py-2 text-[11px] leading-6 sm:text-xs ${toneCls(x.tone)}`}>{x.text}</div>
                ))}
              </div>
            )}
          </Section>

          <Section id="profit" title="محاسبه‌ی سود و نقطه‌ی سربه‌سر" preview={!needTour && hasCosts ? money(expectedProfit) : undefined} openId={openId} setOpenId={setOpenId}>
            {needTour ? (
              <p className="text-[11px] leading-6 text-zinc-100">برای محاسبه‌ی سود، یک تور مشخص را از لیست بالا انتخاب کنید.</p>
            ) : (
              <>
                <p className="mb-3 text-[11px] leading-6 text-zinc-100">
                  هزینه‌ها را وارد کنید تا سود فعلی و تعداد نفر لازم برای سربه‌سر شدن حساب شود. مقادیر برای هر تور جدا و در حساب شما ذخیره می‌شود و فقط خودتان می‌بینید.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <MoneyField label="ظرفیت تور (نفر)" value={capacity} onChange={edit(setCapacity)} />
                  <MoneyField label="هزینه‌ی ثابت تور (تومان)" hint="مثل اجاره‌ی اتوبوس، لیدری، تبلیغات" value={fixedCost} onChange={edit(setFixedCost)} />
                  <MoneyField label="هزینه‌ی هر نفر (تومان)" hint="مثل اقامت، غذا، بیمه، ورودی‌ها" value={perPerson} onChange={edit(setPerPerson)} />
                </div>
                <div className={`mt-2 text-[10px] ${saveCls}`} aria-live="polite">{saveLabel}</div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <Kpi label="هزینه‌ی کل (با ثبت‌نام فعلی)" value={hasCosts ? money(totalCost) : '—'} />
                  <Kpi label="سود پیش‌بینی‌شده" value={hasCosts ? money(expectedProfit) : '—'} tone={expectedProfit >= 0 ? 'green' : 'red'} sub={hasCosts && f.revenue > 0 ? `حاشیه ${fa(margin)}٪` : undefined} />
                  <Kpi label="سود نقدی تا الان (وصول‌شده − هزینه)" value={hasCosts ? money(cashProfit) : '—'} tone={cashProfit >= 0 ? 'green' : 'red'} />
                  <Kpi label="درآمد میانگین هر نفر" value={f.seats > 0 ? money(avgPerSeat) : '—'} />
                  <Kpi
                    label="سربه‌سر (تعداد نفر)"
                    value={hasCosts ? (breakEven === null ? 'ناممکن' : fixed > 0 ? `${fa(breakEven)} نفر` : 'از نفر اول سودآور') : '—'}
                    sub={breakEven === null && hasCosts ? 'هزینه‌ی هر نفر از درآمد هر نفر بیشتر است' : undefined}
                    tone="amber"
                  />
                  <Kpi label="صندلی خالی" value={remaining === null ? '—' : fa(Math.max(0, remaining))} sub={cap > 0 ? `پُری ${pct(fillPct)}` : 'ظرفیت را وارد کنید'} />
                </div>

                {profitAtCap !== null && hasCosts && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[11px] leading-6 text-zinc-300 sm:text-xs">
                    اگر ظرفیت تور ({fa(cap)} نفر) کامل شود و میانگین مبلغ هر نفر همین باشد،
                    سود تقریبی تور <b className={profitAtCap >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{money(profitAtCap)}</b> می‌شود.
                  </div>
                )}
              </>
            )}
          </Section>

          <Section id="hotels" title="درآمد به تفکیک هتل" preview={`${fa(Object.keys(f.hotels).length)} گزینه`} openId={openId} setOpenId={setOpenId}>
            <div className="space-y-3">
              {Object.keys(f.hotels).length === 0 && <div className="text-[11px] text-zinc-100">داده‌ای نیست.</div>}
              {Object.entries(f.hotels).sort((a, b) => b[1].revenue - a[1].revenue).map(([name, v]) => (
                <Bar key={name} label={name} sub={`${fa(v.seats)} نفر · ${money(v.revenue)}`} value={v.revenue} max={maxHotel} />
              ))}
            </div>
          </Section>

          <Section id="transports" title="درآمد به تفکیک حمل‌ونقل" preview={`${fa(Object.keys(f.transports).length)} گزینه`} openId={openId} setOpenId={setOpenId}>
            <div className="space-y-3">
              {Object.keys(f.transports).length === 0 && <div className="text-[11px] text-zinc-100">داده‌ای نیست.</div>}
              {Object.entries(f.transports).sort((a, b) => b[1].revenue - a[1].revenue).map(([name, v]) => (
                <Bar key={name} label={name} sub={`${fa(v.seats)} نفر · ${money(v.revenue)}`} value={v.revenue} max={maxTransport} />
              ))}
            </div>
          </Section>

          <Section id="trend" title="ثبت‌نام‌های ۱۴ روز اخیر" preview={`${fa(trend.reduce((a, x) => a + x.count, 0))} ثبت‌نام`} openId={openId} setOpenId={setOpenId}>
            <div className="flex h-24 items-end gap-1" dir="ltr">
              {trend.map((x, i) => (
                <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[9px] text-zinc-100">{x.count ? fa(x.count) : ''}</span>
                  <div className="w-full rounded-t bg-[#F9704E]" style={{ height: `${x.count ? Math.max(6, (x.count / trendMax) * 70) : 2}px`, opacity: x.count ? 1 : 0.25 }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[9px] text-zinc-100" dir="rtl">
              <span>{trend[13].d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}</span>
              <span>{trend[0].d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}</span>
            </div>
          </Section>

          <p className="pb-2 text-[10px] leading-5 text-zinc-900">
            توضیح: مبالغ از روی «مبلغ ثبت‌شده» هر مسافر حساب می‌شود و ردشده‌ها در جمع نیستند. «بیعانه» جدا از «وصول‌شده» آمده، چون مبلغ واقعی بیعانه در سیستم جدا ثبت نمی‌شود.
          </p>
        </div>
      </div>
    </div>
  );
}