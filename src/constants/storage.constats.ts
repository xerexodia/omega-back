import { join } from 'path';
console.log(process.env.SERVER_URL);
export const STORAGE_CONFIG = {
  LOCAL_STORAGE_PATH: join(process.cwd(), 'uploads'),
  SERVER_URL:
    process.env.SERVER_URL || 'https://shopify-back-wysa.onrender.com',
};
