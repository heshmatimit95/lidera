import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function requireAdmin() {
  const token = (await cookies()).get('admin_token')?.value;
  const s = process.env.JWT_SECRET;
  // همان شرط middleware: کلید کوتاه‌تر از ۳۲ کاراکتر پذیرفته نمی‌شود
  if (!token || !s || s.length < 32) throw new Error('Unauthorized');
  const { payload } = await jwtVerify(token, new TextEncoder().encode(s), {
    algorithms: ['HS256'],
  });
  if (payload.role !== 'admin') throw new Error('Unauthorized');
}