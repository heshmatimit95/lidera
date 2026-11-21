'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaTimes, FaChartLine, FaCopy, FaChevronDown, FaChevronRight, FaChevronLeft } from 'react-icons/fa';

// ───────── ابزارها ─────────
const toEn = (s: any) =>
  String(s ?? '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
const num = (v: any) => {
  const d = toEn(v).replace(/[^0-9]/g, '');
  return d ? Number(d) : 0;
};
const pnum = (v: any) => {
  const n = Number(toEn(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const fa = (n: number) => Math.round(Number.isFinite(n) ? n : 0).toLocaleString('fa-IR');
const money = (n: number) => fa(n) + ' تومان';
const pct = (n: number) => fa(Math.max(0, Math.min(100, n))) + '٪';

// ───────── بازه‌های زمانی شمسی (به وقت تهران؛ بدون کتابخانه) ─────────
const DAY = 86400000;
const TZ_OFF = 3.5 * 3600000; // تهران: UTC+3:30 (ساعت تابستانی لغو شده)
type PKind = 'week' | 'month' | 'year' | 'all';

const jparts = (ms: number) => {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', { timeZone: 'Asia/Tehran', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(ms));
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value || 0);
  return { y: g('year') || g('relatedYear'), m: g('month'), d: g('day') };
};
const dayStart = (ms: number) => Math.floor((ms + TZ_OFF) / DAY) * DAY - TZ_OFF;
const weekdaySat = (ms: number) => (new Date(ms + TZ_OFF).getUTCDay() + 1) % 7; // شنبه = ۰
const doy = (j: { m: number; d: number }) => (j.m <= 6 ? (j.m - 1) * 31 + j.d : 186 + (j.m - 7) * 30 + j.d);
const jAt = (ms: number) => jparts(dayStart(ms) + DAY / 2);

function rangeFor(kind: PKind, anchor: number): { start: number; end: number } | null {
  if (kind === 'all') return null;
  const s0 = dayStart(anchor);
  const j = jAt(anchor);
  if (kind === 'week') {
    const start = s0 - weekdaySat(s0) * DAY;
    return { start, end: start + 7 * DAY };
  }
  if (kind === 'month') {
    const start = s0 - (j.d - 1) * DAY;
    let e = start + 28 * DAY;
    while (jAt(e).d !== 1) e += DAY;
    return { start, end: e };
  }
  const start = s0 - (doy(j) - 1) * DAY;
  let e = start + 364 * DAY;
  while (!(jAt(e).m === 1 && jAt(e).d === 1)) e += DAY;
  return { start, end: e };
}

const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const jfmt = (ms: number, opt: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Asia/Tehran', ...opt }).format(new Date(ms));
function labelFor(kind: PKind, r: { start: number; end: number } | null) {
  if (!r) return 'از ابتدا تا امروز';
  if (kind === 'week') return `${jfmt(r.start + DAY / 2, { day: 'numeric', month: 'long' })} تا ${jfmt(r.end - DAY / 2, { day: 'numeric', month: 'long' })}`;
  if (kind === 'month') return jfmt(r.start + DAY / 2, { month: 'long', year: 'numeric' });
  return `سال ${jfmt(r.start + DAY / 2, { year: 'numeric' })}`;
}
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' });

// ───────── نوع داده‌ی گزارش سرور ─────────
type Totals = {
  regs: number; seats: number; revenue: number; paid: number; deposit: number; receipt: number; waiting: number; rejected: number;
  rejectedCount: number; receiptCount: number; depositCount: number; staleCount: number;
};
type Report = {
  totals: Totals;
  hotels: Record<string, { seats: number; revenue: number }>;
  transports: Record<string, { seats: number; revenue: number }>;
  days: Record<string, number>;
  truncated: boolean;
};
const EMPTY: Report = {
  totals: { regs: 0, seats: 0, revenue: 0, paid: 0, deposit: 0, receipt: 0, waiting: 0, rejected: 0, rejectedCount: 0, receiptCount: 0, depositCount: 0, staleCount: 0 },
  hotels: {}, transports: {}, days: {}, truncated: false,
};

async function loadReport(tourId: string, range: { start: number; end: number } | null, signal: AbortSignal): Promise<Report> {
  const q = new URLSearchParams();
  if (tourId) q.set('tourId', tourId);
  if (range) { q.set('from', new Date(range.start).toISOString()); q.set('to', new Date(range.end).toISOString()); }
  const res = await fetch(`/api/tours/finance/report?${q.toString()}`, { cache: 'no-store', signal });
  if (!res.ok) throw new Error('report');
  return res.json();
}

// ───────── اجزای ظاهری ─────────
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
        className="w-full min-w-0 rounded-xl border-2 border-[#F9704E]/80 bg-black/40 p-2.5 text-base text-white outline-none focus:ring-2 focus:ring-[#F9704E]/30 sm:text-xs"
      />
      {hint && <span className="mt-1 block text-[10px] text-zinc-500">{hint}</span>}
    </label>
  );
}

function PctField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-zinc-300">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(toEn(e.target.value).replace(/[^0-9.]/g, '').slice(0, 4))}
        placeholder="۰"
        className="w-full min-w-0 rounded-xl border-2 border-[#F9704E]/80 bg-black/40 p-2.5 text-base text-white outline-none focus:ring-2 focus:ring-[#F9704E]/30 sm:text-xs"
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

// بخش کشویی: هر لحظه یک بخش باز است تا در موبایل صفحه بلند نشود
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

// نسخه‌ی ساده: سود و سربه‌سر پنهان است. برای فعال‌کردن دوباره، این را true کنید.
const SHOW_PROFIT = false;

type CmpRow = { id: string; name: string; regs: number; seats: number; revenue: number; paid: number };

const KIND_LABEL: Record<PKind, string> = { week: 'هفته', month: 'ماه', year: 'سال', all: 'همه' };

export default function TourFinancePanel({
  tours,
  onClose,
}: {
  tours: any[];
  passengers?: any[]; // دیگر لازم نیست؛ گزارش از سرور می‌آید (برای سازگاری با فراخوانی قبلی نگه داشته شده)
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string>(() => (tours && tours[0] ? String(tours[0].id || tours[0].name) : 'all'));
  const [openId, setOpenId] = useState<string>('summary');
  const [kind, setKind] = useState<PKind>('month');
  const [anchor, setAnchor] = useState<number>(() => Date.now());

  const tour = useMemo(() => (selected === 'all' ? null : (tours || []).find((t: any) => (t.id || t.name) === selected) || null), [selected, tours]);
  const tourId: string = tour?.id || '';
  const needTour = selected === 'all';

  const range = useMemo(() => rangeFor(kind, anchor), [kind, anchor]);
  const isCurrent = !range || range.end > Date.now();

  // ───── گزارش بازه (خلاصه، هتل، حمل‌ونقل، روند) و گزارش کل تور (برای سود) ─────
  const [rep, setRep] = useState<Report>(EMPTY);
  const [allRep, setAllRep] = useState<Report>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setLoadErr(false);
    (async () => {
      try {
        const r1 = await loadReport(tourId, range, ac.signal);
        setRep(r1);
        if (!range) setAllRep(r1);
        else if (tourId) setAllRep(await loadReport(tourId, null, ac.signal));
        else setAllRep(r1);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setLoadErr(true);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [tourId, range?.start, range?.end]); // eslint-disable-line react-hooks/exhaustive-deps

  // ───── جدول مقایسه‌ی تورها (فقط در حالت «همه‌ی تورها») ─────
  const [cmp, setCmp] = useState<CmpRow[]>([]);
  useEffect(() => {
    if (!needTour) { setCmp([]); return; }
    const ac = new AbortController();
    (async () => {
      try {
        const q = new URLSearchParams({ compare: '1' });
        if (range) { q.set('from', new Date(range.start).toISOString()); q.set('to', new Date(range.end).toISOString()); }
        const res = await fetch(`/api/tours/finance/report?${q.toString()}`, { cache: 'no-store', signal: ac.signal });
        const d = res.ok ? await res.json() : {};
        if (!ac.signal.aborted) setCmp(Array.isArray(d.compare) ? d.compare : []);
      } catch {}
    })();
    return () => ac.abort();
  }, [needTour, range?.start, range?.end]); // eslint-disable-line react-hooks/exhaustive-deps

  // ───── ظرفیت و هزینه‌ها: در دیتابیس (برای هر تور) ─────
  const [capacity, setCapacity] = useState('');
  const [fixedCost, setFixedCost] = useState('');
  const [perPerson, setPerPerson] = useState('');
  const [feePct, setFeePct] = useState('');
  const [reservePct, setReservePct] = useState('');
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dirty = useRef(false);

  useEffect(() => {
    setReady(false);
    dirty.current = false;
    setSaveState('idle');
    setCapacity(''); setFixedCost(''); setPerPerson(''); setFeePct(''); setReservePct('');
    if (!tourId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/tours/finance?tourId=${encodeURIComponent(tourId)}`, { cache: 'no-store' });
        const d = res.ok ? await res.json() : {};
        if (!alive) return;
        setCapacity(d.capacity ? String(d.capacity) : '');
        setFixedCost(d.fixedCost ? String(d.fixedCost) : '');
        setPerPerson(d.perPerson ? String(d.perPerson) : '');
        setFeePct(d.feePct ? String(d.feePct) : '');
        setReservePct(d.reservePct ? String(d.reservePct) : '');
      } catch {
        if (alive) setSaveState('error');
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, [tourId]);

  useEffect(() => {
    if (!ready || !tourId || !dirty.current) return;
    setSaveState('saving');
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/tours/finance', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(SHOW_PROFIT ? { tourId, capacity: num(capacity), fixedCost: num(fixedCost), perPerson: num(perPerson), feePct: pnum(feePct), reservePct: pnum(reservePct) } : { tourId, capacity: num(capacity) }),
        });
        setSaveState(res.ok ? 'saved' : 'error');
      } catch { setSaveState('error'); }
    }, 800);
    return () => clearTimeout(t);
  }, [ready, tourId, capacity, fixedCost, perPerson, feePct, reservePct]);

  const edit = (setter: (v: string) => void) => (v: string) => { dirty.current = true; setter(v); };

  // ───── روند ثبت‌نام ─────
  const trend = useMemo(() => {
    const out: { label: string; count: number }[] = [];
    if ((kind === 'week' || kind === 'month') && range) {
      for (let t = range.start; t < range.end; t += DAY) {
        out.push({ label: fa(jAt(t).d), count: rep.days[dayKeyFmt.format(new Date(t + DAY / 2))] || 0 });
      }
      return out;
    }
    const byM: Record<string, number> = {};
    for (const [k, c] of Object.entries(rep.days)) {
      const j = jparts(Date.parse(`${k}T12:00:00+03:30`));
      byM[`${j.y}-${String(j.m).padStart(2, '0')}`] = (byM[`${j.y}-${String(j.m).padStart(2, '0')}`] || 0) + c;
    }
    if (kind === 'year' && range) {
      const y = jAt(range.start).y;
      for (let m = 1; m <= 12; m++) out.push({ label: MONTHS[m - 1], count: byM[`${y}-${String(m).padStart(2, '0')}`] || 0 });
      return out;
    }
    return Object.keys(byM).sort().slice(-12).map((k) => ({ label: MONTHS[Number(k.split('-')[1]) - 1], count: byM[k] }));
  }, [rep.days, kind, range]);
  const trendMax = Math.max(1, ...trend.map((x) => x.count));
  const trendTotal = trend.reduce((a, x) => a + x.count, 0);

  // ───── محاسبه‌ی سود و سربه‌سر (تخمینی؛ روی کل ثبت‌نام‌های تور) ─────
  const f = rep.totals;
  const a = allRep.totals;
  const cap = num(capacity);
  const fixed = num(fixedCost);
  const per = num(perPerson);
  const fee = Math.min(50, pnum(feePct)) / 100;
  const reserve = Math.min(50, pnum(reservePct)) / 100;
  const avgPerSeat = a.seats > 0 ? a.revenue / a.seats : 0;
  const baseCost = fixed + per * a.seats;
  const reserveAmt = baseCost * reserve;
  const feeAmt = a.revenue * fee;
  const totalCost = baseCost + reserveAmt + feeAmt;
  const expectedProfit = a.revenue - totalCost;
  const cashProfit = a.paid - (baseCost + reserveAmt) - a.paid * fee;
  const margin = a.revenue > 0 ? (expectedProfit / a.revenue) * 100 : 0;
  const contribution = avgPerSeat * (1 - fee) - per * (1 + reserve);
  const breakEven = contribution > 0 ? Math.ceil((fixed * (1 + reserve)) / contribution) : null;
  const remaining = cap > 0 ? cap - a.seats : null;
  const fillPct = cap > 0 ? (a.seats / cap) * 100 : 0;
  const profitAtCap = cap > 0 ? contribution * cap - fixed * (1 + reserve) : null;
  const collectPct = f.revenue > 0 ? (f.paid / f.revenue) * 100 : 0;
  const hasCosts = fixed > 0 || per > 0;

  // نتیجه‌گیری ساده (وضعیت فعلی تور، نه فقط بازه)
  const insights: { tone: 'good' | 'warn' | 'bad'; text: string }[] = [];
  if (a.receiptCount > 0) insights.push({ tone: 'warn', text: `${fa(a.receiptCount)} فیش منتظر تأیید شماست.` });
  if (a.staleCount > 0) insights.push({ tone: 'warn', text: `${fa(a.staleCount)} ثبت‌نام بیش از ۳ روز است معوق مانده؛ پیگیری کنید.` });
  if (a.depositCount > 0) insights.push({ tone: 'warn', text: `${fa(a.depositCount)} نفر فقط بیعانه داده‌اند (باقی‌مانده را پیگیری کنید).` });
  if (a.revenue > 0 && (a.paid / a.revenue) * 100 < 50) insights.push({ tone: 'bad', text: 'کمتر از نیمی از مبلغ ثبت‌شده وصول شده است.' });
  if (SHOW_PROFIT && !needTour && hasCosts && a.seats > 0) {
    if (expectedProfit < 0) insights.push({ tone: 'bad', text: `با هزینه‌های واردشده، تور فعلاً حدود ${money(-expectedProfit)} زیان‌ده است (تخمینی).` });
    else insights.push({ tone: 'good', text: `سود پیش‌بینی‌شده‌ی فعلی حدود ${money(expectedProfit)} است (تخمینی، حاشیه ${fa(margin)}٪).` });
  }
  if (SHOW_PROFIT && !needTour && breakEven !== null && fixed > 0 && a.seats < breakEven) insights.push({ tone: 'warn', text: `برای سربه‌سر شدن حدود ${fa(breakEven - a.seats)} نفر دیگر لازم است.` });
  if (remaining !== null && remaining <= Math.ceil(cap * 0.2) && remaining >= 0) insights.push({ tone: 'good', text: `فقط ${fa(remaining)} صندلی خالی مانده؛ زمان خوبی برای تبلیغ «آخرین ظرفیت» است.` });
  if (remaining !== null && remaining < 0) insights.push({ tone: 'bad', text: `ثبت‌نام‌ها ${fa(-remaining)} نفر از ظرفیت بیشتر است.` });
  if (rep.truncated || allRep.truncated) insights.push({ tone: 'warn', text: 'حجم داده بسیار زیاد است و گزارش روی ۲۰٬۰۰۰ ثبت‌نام آخر حساب شده.' });

  const maxHotel = Math.max(0, ...Object.values(rep.hotels).map((x) => x.revenue));
  const maxTransport = Math.max(0, ...Object.values(rep.transports).map((x) => x.revenue));
  const periodLabel = labelFor(kind, range);

  const summaryText = () => {
    const lines = [
      `📊 گزارش مالی ${tour ? tour.name : 'همه‌ی تورها'} — ${periodLabel}`,
      `ثبت‌نام: ${fa(f.regs)} (${fa(f.seats)} نفر)`,
      `جمع مبلغ ثبت‌شده: ${money(f.revenue)}`,
      `وصول‌شده: ${money(f.paid)} (${pct(collectPct)})`,
      `بیعانه: ${money(f.deposit)}`,
      `در انتظار پرداخت/تأیید: ${money(f.waiting + f.receipt)}`,
    ];
    if (SHOW_PROFIT && !needTour && hasCosts) {
      lines.push(`— کل تور (تخمینی) —`);
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

  const changeKind = (k: PKind) => { setKind(k); setAnchor(Date.now()); };
  const go = (dir: -1 | 1) => {
    if (!range) return;
    setAnchor(dir < 0 ? range.start - DAY / 2 : range.end + DAY / 2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4" dir="rtl" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col rounded-t-2xl border-2 border-[#E5C060] bg-[#121214] text-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl">
        {/* سربرگ ثابت */}
        <div className="shrink-0 border-b-2 border-[#F9704E]/40 px-4 pb-3 pt-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#F9704E] sm:text-base">
              <FaChartLine /> تحلیل مالی تور
            </h3>
            <button type="button" onClick={onClose} className="cursor-pointer p-1 text-zinc-400 hover:text-white" aria-label="بستن">
              <FaTimes size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={selected}
              onChange={(e) => { setSelected(e.target.value); setOpenId('summary'); }}
              className="min-w-0 flex-1 rounded-xl border-2 border-[#F9704E]/80 bg-black/40 p-2.5 text-base text-white outline-none sm:text-xs"
            >
              <option value="all" className="bg-white text-black">همه‌ی تورها</option>
              {(tours || []).map((t: any) => (
                <option key={t.id || t.name} value={t.id || t.name} className="bg-white text-black">{t.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={copySummary}
              className="inline-flex min-h-40px w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 border-[#F9704E] bg-[#F9704E]/15 px-4 py-2 text-xs font-bold text-[#F9704E] hover:bg-[#F9704E]/25 sm:w-auto"
            >
              <FaCopy size={11} /> {copied ? 'کپی شد ✓' : 'کپی خلاصه‌ی گزارش'}
            </button>
          </div>

          {/* انتخاب دوره */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex shrink-0 overflow-hidden rounded-xl border-2 border-[#F9704E]/80">
              {(['week', 'month', 'year', 'all'] as PKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => changeKind(k)}
                  className={`min-h-36px cursor-pointer px-3 text-[11px] font-bold ${kind === k ? 'bg-[#F9704E] text-white' : 'text-zinc-300 hover:bg-white/10'}`}
                >
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
              <button type="button" onClick={() => go(-1)} disabled={!range} aria-label="دوره‌ی قبل" className="cursor-pointer p-2 text-[#F9704E] disabled:opacity-30">
                <FaChevronRight size={12} />
              </button>
              <span className="min-w-0 truncate text-center text-[11px] font-bold text-white">{periodLabel}</span>
              <button type="button" onClick={() => go(1)} disabled={!range || isCurrent} aria-label="دوره‌ی بعد" className="cursor-pointer p-2 text-[#F9704E] disabled:opacity-30">
                <FaChevronLeft size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* بدنه‌ی اسکرول‌شونده با بخش‌های کشویی */}
        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6" aria-busy={loading}>
          {loadErr && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">گزارش بارگذاری نشد. اینترنت را بررسی کنید و دوباره تلاش کنید.</div>
          )}
          {loading && !loadErr && <div className="text-center text-[11px] text-zinc-400">در حال محاسبه…</div>}

          <Section id="summary" title="خلاصه‌ی وضعیت" preview={`وصول ${pct(collectPct)}`} openId={openId} setOpenId={setOpenId}>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <Kpi label="ثبت‌نام (به‌جز ردشده‌ها)" value={`${fa(f.regs)} ثبت‌نام / ${fa(f.seats)} نفر`} tone="orange" />
              <Kpi label="جمع مبلغ ثبت‌شده" value={money(f.revenue)} />
              <Kpi label="وصول‌شده (پرداخت‌شده)" value={money(f.paid)} sub={`${pct(collectPct)} از کل`} tone="green" />
              <Kpi label="بیعانه" value={money(f.deposit)} sub={`${fa(f.depositCount)} نفر`} tone="amber" />
              <Kpi label="در انتظار پرداخت یا تأیید" value={money(f.waiting + f.receipt)} sub={`${fa(f.receiptCount)} فیش منتظر تأیید`} tone="amber" />
              <Kpi label="ردشده / مغایرت" value={money(f.rejected)} sub={`${fa(f.rejectedCount)} مورد (در جمع نیست)`} tone="red" />
              <Kpi label="مانده‌ی قابل وصول" value={money(Math.max(0, f.revenue - f.paid))} sub="جمع ثبت‌شده منهای وصول‌شده" tone="amber" />
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="mb-1.5 flex justify-between text-[11px] text-zinc-300">
                <span>درصد وصول مبلغ</span>
                <span className="font-bold text-emerald-400">{pct(collectPct)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, collectPct)}%` }} />
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-5 text-zinc-500">اعداد این بخش بر اساس تاریخ ثبت‌نام مسافر در «{periodLabel}» است.</p>
          </Section>

          <Section id="alerts" title="هشدارها و پیشنهادها" preview={insights.length ? `${fa(insights.length)} مورد` : 'موردی نیست'} openId={openId} setOpenId={setOpenId}>
            {insights.length === 0 ? (
              <p className="text-[11px] leading-6 text-zinc-400">فعلاً موردی که نیاز به پیگیری باشد نیست.</p>
            ) : (
              <div className="space-y-2">
                {insights.map((x, i) => (
                  <div key={i} className={`rounded-xl border px-3 py-2 text-[11px] leading-6 sm:text-xs ${toneCls(x.tone)}`}>{x.text}</div>
                ))}
              </div>
            )}
          </Section>

          {needTour ? (
            <Section id="compare" title="مقایسه‌ی تورها" preview={`${fa(cmp.length)} تور`} openId={openId} setOpenId={setOpenId}>
              {cmp.length === 0 ? (
                <div className="text-[11px] text-zinc-500">در این دوره ثبت‌نامی نیست.</div>
              ) : (
                <div className="-mx-1 overflow-x-auto">
                  <table className="w-full min-w-460px text-right text-[11px]">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-400">
                        <th className="px-1 py-2 font-bold">تور</th>
                        <th className="px-1 py-2 font-bold">ثبت‌نام</th>
                        <th className="px-1 py-2 font-bold">درآمد</th>
                        <th className="px-1 py-2 font-bold">وصول‌شده</th>
                        <th className="px-1 py-2 font-bold">وصول</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cmp.map((r) => (
                        <tr key={r.id || r.name} className="border-b border-white/5">
                          <td className="max-w-140px truncate px-1 py-2 font-bold text-white">{r.name}</td>
                          <td className="px-1 py-2 text-zinc-300">{fa(r.regs)} ({fa(r.seats)} نفر)</td>
                          <td className="px-1 py-2 text-zinc-300">{money(r.revenue)}</td>
                          <td className="px-1 py-2 text-emerald-400">{money(r.paid)}</td>
                          <td className="px-1 py-2 text-[#F9704E]">{pct(r.revenue > 0 ? (r.paid / r.revenue) * 100 : 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-2 text-[10px] leading-5 text-zinc-500">برای دیدن جزئیات یک تور، آن را از لیست بالا انتخاب کنید.</p>
            </Section>
          ) : (
            <Section id="capacity" title="ظرفیت و صندلی خالی" preview={remaining === null ? 'ظرفیت را وارد کنید' : `${fa(Math.max(0, remaining))} خالی`} openId={openId} setOpenId={setOpenId}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MoneyField label="ظرفیت تور (نفر)" value={capacity} onChange={edit(setCapacity)} />
                <Kpi label="صندلی خالی" value={remaining === null ? '—' : fa(Math.max(0, remaining))} sub={cap > 0 ? `پُری ${pct(fillPct)} · ${fa(a.seats)} نفر ثبت‌نام` : 'ظرفیت را وارد کنید'} />
              </div>
              <div className={`mt-2 text-[10px] ${saveCls}`} aria-live="polite">{saveLabel}</div>
            </Section>
          )}

          {SHOW_PROFIT && (
          <Section id="profit" title="سود و نقطه‌ی سربه‌سر (تخمینی)" preview={!needTour && hasCosts ? money(expectedProfit) : undefined} openId={openId} setOpenId={setOpenId}>
            {needTour ? (
              <p className="text-[11px] leading-6 text-zinc-400">برای محاسبه‌ی سود، یک تور مشخص را از لیست بالا انتخاب کنید.</p>
            ) : (
              <>
                <p className="mb-3 text-[11px] leading-6 text-zinc-400">
                  هزینه‌ها را وارد کنید تا سودِ <b className="text-white">کل تور</b> (مستقل از دوره‌ی انتخابی) حدود حساب شود. مقادیر برای هر تور جدا در حساب شما ذخیره می‌شود و فقط خودتان می‌بینید.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <MoneyField label="ظرفیت تور (نفر)" value={capacity} onChange={edit(setCapacity)} />
                  <MoneyField label="هزینه‌ی ثابت تور (تومان)" hint="مثل اجاره‌ی اتوبوس، لیدری، تبلیغات" value={fixedCost} onChange={edit(setFixedCost)} />
                  <MoneyField label="هزینه‌ی هر نفر (تومان)" hint="مثل اقامت، غذا، بیمه، ورودی‌ها" value={perPerson} onChange={edit(setPerPerson)} />
                  <PctField label="کارمزد درگاه / بانک (٪)" hint="معمولاً ۱ تا ۲؛ روی کل مبلغ حساب می‌شود" value={feePct} onChange={edit(setFeePct)} />
                  <PctField label="ذخیره‌ی احتیاط (٪)" hint="برای هزینه‌های پیش‌بینی‌نشده؛ معمولاً ۵ تا ۱۰" value={reservePct} onChange={edit(setReservePct)} />
                </div>
                <div className={`mt-2 text-[10px] ${saveCls}`} aria-live="polite">{saveLabel}</div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <Kpi label="هزینه‌ی کل تخمینی (با ثبت‌نام فعلی)" value={hasCosts ? money(totalCost) : '—'} sub={hasCosts && (fee > 0 || reserve > 0) ? `شامل کارمزد ${money(feeAmt)} و احتیاط ${money(reserveAmt)}` : undefined} />
                  <Kpi label="سود پیش‌بینی‌شده (تخمینی)" value={hasCosts ? money(expectedProfit) : '—'} tone={expectedProfit >= 0 ? 'green' : 'red'} sub={hasCosts && a.revenue > 0 ? `حاشیه ${fa(margin)}٪` : undefined} />
                  <Kpi label="سود نقدی تا الان (وصول‌شده − هزینه)" value={hasCosts ? money(cashProfit) : '—'} tone={cashProfit >= 0 ? 'green' : 'red'} />
                  <Kpi label="درآمد میانگین هر نفر" value={a.seats > 0 ? money(avgPerSeat) : '—'} />
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
                <p className="mt-2 text-[10px] leading-5 text-zinc-500">
                  این اعداد تخمینی‌اند و برای تصمیم‌گیری سریع هستند، نه جایگزین دفتر حسابداری. مالیات و استرداد حساب نشده است.
                </p>
              </>
            )}
          </Section>
          )}

          <Section id="hotels" title="درآمد به تفکیک هتل" preview={`${fa(Object.keys(rep.hotels).length)} گزینه`} openId={openId} setOpenId={setOpenId}>
            <div className="space-y-3">
              {Object.keys(rep.hotels).length === 0 && <div className="text-[11px] text-zinc-500">داده‌ای نیست.</div>}
              {Object.entries(rep.hotels).sort((x, y) => y[1].revenue - x[1].revenue).map(([name, v]) => (
                <Bar key={name} label={name} sub={`${fa(v.seats)} نفر · ${money(v.revenue)}`} value={v.revenue} max={maxHotel} />
              ))}
            </div>
          </Section>

          <Section id="transports" title="درآمد به تفکیک حمل‌ونقل" preview={`${fa(Object.keys(rep.transports).length)} گزینه`} openId={openId} setOpenId={setOpenId}>
            <div className="space-y-3">
              {Object.keys(rep.transports).length === 0 && <div className="text-[11px] text-zinc-500">داده‌ای نیست.</div>}
              {Object.entries(rep.transports).sort((x, y) => y[1].revenue - x[1].revenue).map(([name, v]) => (
                <Bar key={name} label={name} sub={`${fa(v.seats)} نفر · ${money(v.revenue)}`} value={v.revenue} max={maxTransport} />
              ))}
            </div>
          </Section>

          <Section id="trend" title={kind === 'year' || kind === 'all' ? 'ثبت‌نام‌ها به تفکیک ماه' : 'ثبت‌نام‌ها به تفکیک روز'} preview={`${fa(trendTotal)} ثبت‌نام`} openId={openId} setOpenId={setOpenId}>
            {trend.length === 0 ? (
              <div className="text-[11px] text-zinc-500">داده‌ای نیست.</div>
            ) : (
              <div className="flex h-28 items-end gap-0.5" dir="rtl">
                {trend.map((x, i) => (
                  <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[8px] text-zinc-400">{x.count ? fa(x.count) : ''}</span>
                    <div className="w-full rounded-t bg-[#F9704E]" style={{ height: `${x.count ? Math.max(6, (x.count / trendMax) * 70) : 2}px`, opacity: x.count ? 1 : 0.25 }} />
                    {trend.length <= 14 && <span className="w-full truncate text-center text-[8px] text-zinc-500">{x.label}</span>}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <p className="pb-2 text-[10px] leading-5 text-zinc-500">
            توضیح: مبالغ از روی «مبلغ ثبت‌شده» هر مسافر و از دیتابیس حساب می‌شود و ردشده‌ها در جمع نیستند. «بیعانه» جدا از «وصول‌شده» آمده، چون مبلغ واقعی بیعانه و اقساط هنوز جدا ثبت نمی‌شود.
          </p>
        </div>
      </div>
    </div>
  );
}