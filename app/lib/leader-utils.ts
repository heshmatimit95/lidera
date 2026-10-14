import { createHash } from 'crypto';

export function hashNationalId(id: string): string {
  return createHash('sha256').update(id).digest('hex');
}