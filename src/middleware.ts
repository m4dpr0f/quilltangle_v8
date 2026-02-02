import { defineMiddleware } from 'astro:middleware';

/**
 * 8xM Platform Middleware
 *
 * Handles:
 * - CORS headers for cross-origin API access (embeddability)
 * - Request logging (optional)
 * - Security headers
 */

// Allowed origins for CORS (add your domains here)
const ALLOWED_ORIGINS = [
  'https://8xm.fun',
  'https://quilu.xyz',
  'https://quillverse.org',
  'http://localhost:4321', // Local dev
  'http://localhost:3000', // Common dev ports
  'http://localhost:5173',
];

// Allow all origins in development
const isDev = import.meta.env.DEV;

export const onRequest = defineMiddleware(async ({ request, url }, next) => {
  // Get the origin header
  const origin = request.headers.get('origin') || '';

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const headers = new Headers();

    // Check if origin is allowed
    if (isDev || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.8xm.fun') || origin.endsWith('.quillverse.org')) {
      headers.set('Access-Control-Allow-Origin', origin);
    } else {
      // Allow any origin for public API endpoints
      headers.set('Access-Control-Allow-Origin', '*');
    }

    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    headers.set('Access-Control-Allow-Credentials', 'true');

    return new Response(null, {
      status: 204,
      headers,
    });
  }

  // Process the request
  const response = await next();

  // Clone response to modify headers
  const newResponse = new Response(response.body, response);

  // Add CORS headers to all responses
  if (isDev || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.8xm.fun') || origin.endsWith('.quillverse.org')) {
    newResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
  } else if (url.pathname.startsWith('/api/')) {
    // Public API endpoints allow any origin
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
  }

  newResponse.headers.set('Access-Control-Allow-Credentials', 'true');

  // Security headers
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Allow embedding in iframes for widget usage (override X-Frame-Options for embed routes)
  if (url.pathname.startsWith('/embed/')) {
    newResponse.headers.delete('X-Frame-Options');
    newResponse.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://*.8xm.fun https://*.quillverse.org https://*.quilu.xyz");
  }

  return newResponse;
});
