import { v2 as cloudinary } from 'cloudinary';

const url = process.env.CLOUDINARY_URL;
if (url && url.startsWith('cloudinary://')) {
  cloudinary.config({ url: url.trim() });
}

export default cloudinary;