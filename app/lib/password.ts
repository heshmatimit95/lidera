import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);
export const generatePassword = () => randomBytes(6).toString('base64url');