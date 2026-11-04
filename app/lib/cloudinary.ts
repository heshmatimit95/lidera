import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL?.split('@')[1],
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_URL?.split('//')[1]?.split(':')[0],
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_URL?.split(':')[2]?.split('@')[0],
});

export default cloudinary;