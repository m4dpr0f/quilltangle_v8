import { neon } from '@neondatabase/serverless';

export function getDb() {
  // Try import.meta.env first (Vite/Astro), then process.env (Cloudflare Workers)
  const url = import.meta.env.DATABASE_URL_8XM ||
              (typeof process !== 'undefined' && process.env?.DATABASE_URL_8XM);

  if (!url || url.trim() === '') {
    throw new Error(
      'DATABASE_URL_8XM not configured. Set it in Cloudflare Pages dashboard: ' +
      'Settings > Environment variables > Add variable'
    );
  }
  return neon(url);
}
