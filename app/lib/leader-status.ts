const norm = (s?: string | null) => String(s ?? '').trim().toLowerCase();

export const isActive = (s?: string | null) => norm(s) === 'active';
export const isBlocked = (s?: string | null) => norm(s) === 'blocked';
export const isPending = (s?: string | null) => norm(s) === 'pending';