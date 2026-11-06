// lib/rate-limit.ts
type Entry = { count: number; resetTime: number };

const store = new Map<string, Entry>();
const MAX_ENTRIES = 10_000; // سقف حافظه
let lastCleanup = 0;

function cleanup(now: number) {
  // حداکثر هر ۳۰ ثانیه یک بار
  if (now - lastCleanup < 30_000 && store.size < MAX_ENTRIES) return;
  lastCleanup = now;

  for (const [key, rec] of store) {
    if (rec.resetTime <= now) store.delete(key);
  }

  // اگر هنوز پر بود، قدیمی‌ترین‌ها را حذف کن
  if (store.size >= MAX_ENTRIES) {
    const overflow = store.size - MAX_ENTRIES + 1;
    let removed = 0;
    for (const key of store.keys()) {
      store.delete(key);
      if (++removed >= overflow) break;
    }
  }
}

export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 60 * 1000
): { success: boolean; remainingTime?: number } {
  const now = Date.now();
  cleanup(now);

  const record = store.get(key);

  if (!record || now > record.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true };
  }

  if (record.count >= limit) {
    const remainingTime = Math.ceil((record.resetTime - now) / 1000);
    return { success: false, remainingTime };
  }

  record.count += 1;
  return { success: true };
}

// بعد از ورود موفق صدا بزن تا کاربر درست قفل نشود
export function resetRateLimit(key: string) {
  store.delete(key);
}