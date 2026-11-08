import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function requireAdmin() {
  const token = (await cookies()).get('admin_token')?.value;
  const s = process.env.JWT_SECRET;
  if (!token || !s) throw new Error('Unauthorized');
  const { payload } = await jwtVerify(token, new TextEncoder().encode(s));
  if (payload.role !== 'admin') throw new Error('Unauthorized');
}