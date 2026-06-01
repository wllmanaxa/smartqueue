/**
 * Single source for API URLs — set VITE_API_BASE_URL in .env (local) or Vercel env (production).
 * In dev without .env, falls back to Vite proxy path /api/v1.0.
 */
export function getApiBaseUrl() {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  if (import.meta.env.DEV) return '/api/v1.0';
  throw new Error(
    'VITE_API_BASE_URL is required for production builds (e.g. https://your-api.onrender.com/api/v1.0).'
  );
}

/** SignalR hub root (backend origin without /api/v1.0 path). */
export function getHubBaseUrl() {
  const explicit = import.meta.env.VITE_HUB_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const api = getApiBaseUrl();
  if (api.startsWith('/')) return '';
  return api.replace(/\/api\/v[\d.]+$/i, '');
}
